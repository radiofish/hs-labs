import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { resume } = await request.json();

    if (!resume || resume.trim().length === 0) {
      return NextResponse.json(
        { error: 'Resume text is required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are a brutally honest resume reviewer with a sharp sense of humor. Your job is to "roast" resumes - give honest, direct feedback that's both helpful and entertaining. Be critical but constructive.

Resume to review:
${resume}

Provide a JSON response with the following structure:
{
  "grade": "A letter grade (A+, A, A-, B+, B, B-, C+, C, C-, D, F)",
  "roast": "A 2-3 paragraph roast that's honest, funny, and direct. Point out specific problems with humor and wit. Be constructive but don't hold back.",
  "fixes": [
    {
      "problem": "❌ [A specific problematic bullet point or phrase from the resume]",
      "fix": "✅ [A specific, improved version with metrics and impact]"
    }
  ],
  "strengths": [
    "✅ [Something they did well]",
    "✅ [Another positive aspect]"
  ],
  "nextSteps": "A concise 1-2 sentence action plan for improvement"
}

Guidelines:
- Be specific: reference actual content from the resume
- Be honest: don't sugarcoat problems
- Be helpful: every criticism should come with a solution
- Be funny: use wit and humor, but stay professional
- Focus on: vague language, lack of metrics, weak action verbs, irrelevant information
- Include 3-5 specific fixes with before/after examples
- Include 2-4 strengths if there are any
- Keep the roast engaging and memorable`;

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Extract the text content from the response
    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected response type from Claude');
    }

    // Try to parse JSON from the response
    let responseText = content.text.trim();
    
    // Remove markdown code blocks if present
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\n?/, '').replace(/\n?```$/, '');
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\n?/, '').replace(/\n?```$/, '');
    }

    let parsedResponse;
    try {
      parsedResponse = JSON.parse(responseText);
    } catch (parseError) {
      // If JSON parsing fails, try to extract JSON from the text
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse JSON from Claude response');
      }
    }

    // Validate and ensure all required fields are present
    const result = {
      grade: parsedResponse.grade || 'C',
      roast: parsedResponse.roast || 'Unable to generate roast. Please try again.',
      fixes: Array.isArray(parsedResponse.fixes) && parsedResponse.fixes.length > 0
        ? parsedResponse.fixes
        : [
            {
              problem: "❌ Unable to generate specific fixes",
              fix: "✅ Please try submitting your resume again"
            }
          ],
      strengths: Array.isArray(parsedResponse.strengths) && parsedResponse.strengths.length > 0
        ? parsedResponse.strengths
        : ["✅ Resume submitted successfully"],
      nextSteps: parsedResponse.nextSteps || "Review the feedback above and work on the specific improvements mentioned."
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating resume roast:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to generate resume roast';
    if (error.error?.message?.includes('model')) {
      errorMessage = `Model not found. Please check your Anthropic API key has access to Claude models. Error: ${error.error.message}`;
    } else if (error.status === 401) {
      errorMessage = 'Invalid API key. Please check your ANTHROPIC_API_KEY environment variable.';
    } else if (error.status === 429) {
      errorMessage = 'Rate limit exceeded. Please try again later.';
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: error.status || 500 }
    );
  }
}

