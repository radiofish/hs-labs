import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { title, userNeed } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const prompt = `Based on the name of this project and optionally the description, please do some preliminary research to generate details on why it wins, seo ability, virality, upsell/hook, data needs and scoring for each RICE output.

Project Name: ${title}
${userNeed ? `Description/User Need: ${userNeed}` : ''}

Please provide a JSON response with the following structure:
{
  "userNeed": "A clear description of the user need/problem this solves",
  "seoAbility": "Assessment of SEO potential with specific keywords and search volume insights",
  "virality": "Analysis of viral potential and shareability factors",
  "upsell": "Suggested upsell/hook for converting free users to accounts",
  "dataNeeds": "What data sources are required to build this",
  "whyItWins": "Key strategic advantage or insight about why this idea is compelling",
  "reach": <number 1-10>,
  "impact": <number 1-10>,
  "confidence": <number 1-10>,
  "effort": <number 1-10>,
  "reasoning": {
    "reach": "Explanation for the reach score",
    "impact": "Explanation for the impact score",
    "confidence": "Explanation for the confidence score",
    "effort": "Explanation for the effort score"
  }
}

Focus on early career job seekers (Gen Z) as the target audience. Be specific and actionable in your responses.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
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
      userNeed: parsedResponse.userNeed || userNeed || `Solving a key problem for early career job seekers related to: ${title}`,
      seoAbility: parsedResponse.seoAbility || 'To be determined - analyze search volume',
      virality: parsedResponse.virality || 'Medium - Needs unique angle for organic sharing',
      upsell: parsedResponse.upsell || 'Unlock additional features by creating a free Handshake account',
      dataNeeds: parsedResponse.dataNeeds || 'To be determined - assess what data sources are needed',
      whyItWins: parsedResponse.whyItWins || 'Addresses a real pain point in the job search journey',
      reach: Math.max(1, Math.min(10, parsedResponse.reach || 6)),
      impact: Math.max(1, Math.min(10, parsedResponse.impact || 6)),
      confidence: Math.max(1, Math.min(10, parsedResponse.confidence || 5)),
      effort: Math.max(1, Math.min(10, parsedResponse.effort || 6)),
      reasoning: parsedResponse.reasoning || {
        reach: parsedResponse.reasoning?.reach || 'To be determined',
        impact: parsedResponse.reasoning?.impact || 'To be determined',
        confidence: parsedResponse.reasoning?.confidence || 'To be determined',
        effort: parsedResponse.reasoning?.effort || 'To be determined',
      },
    };

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error generating idea:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    
    // Provide more helpful error messages
    let errorMessage = error.message || 'Failed to generate idea';
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

