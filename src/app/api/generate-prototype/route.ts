import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

export async function POST(request: NextRequest) {
  try {
    const { title, userNeed, upsell } = await request.json();

    if (!userNeed) {
      return NextResponse.json(
        { error: 'User need is required' },
        { status: 400 }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json(
        { error: 'ANTHROPIC_API_KEY is not configured' },
        { status: 500 }
      );
    }

    const prompt = `You are creating a prototype for a utility tool that addresses this user need: "${userNeed}"

${title ? `The idea is titled: "${title}"` : ''}
${upsell ? `Upsell message: "${upsell}"` : ''}

Create a prototype configuration for a simple, interactive web tool that solves this need. The prototype should:
1. Be practical and immediately useful
2. Have clear inputs and outputs
3. Provide value without requiring complex backend infrastructure
4. Include an upsell/hook to convert free users

Return ONLY valid JSON (no markdown, no code blocks, no explanations) with this exact structure:
{
  "tabName": "A short, emoji-prefixed name for the tab (e.g., '💰 Salary Check')",
  "prototypeConfig": {
    "title": "Main heading for the prototype",
    "description": "Brief description of what the tool does",
    "inputs": [
      {
        "id": "input1",
        "label": "Label for input",
        "type": "text|number|select|textarea",
        "placeholder": "Placeholder text",
        "options": ["option1", "option2"]
      }
    ],
    "outputs": [
      {
        "id": "output1",
        "label": "Label for output",
        "type": "text|number|list|chart"
      }
    ],
    "calculation": {
      "type": "formula",
      "formula": "JavaScript expression using input IDs as variables (e.g., 'input1 * 12' or 'input1 + input2' or 'input1 > 50000 ? \"High\" : \"Low\"')",
      "description": "Human-readable description of what the calculation does"
    },
    "upsellMessage": "Message to convert free users to accounts"
  },
  "prototypeCode": "A simple React component code (as a string) that implements this prototype. Use useState for inputs, include the calculation logic, and render the outputs. Style it similarly to existing prototypes with Tailwind CSS classes."
}

IMPORTANT: 
- Return ONLY the JSON object, nothing else
- All string values must be properly escaped (use \\n for newlines, not actual newlines)
- Do not include any control characters (newlines, tabs, etc.) inside string values
- Use \\n for line breaks in text, not actual newline characters

Focus on early career job seekers (Gen Z) as the target audience. Make it actionable and immediately useful.`;

    const message = await anthropic.messages.create({
      model: 'claude-3-opus-20240229',
      max_tokens: 4000,
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

    // Helper function to fix JSON with unescaped control characters
    const fixJsonControlChars = (jsonStr: string): string => {
      // Find the JSON object
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return jsonStr;
      
      let fixed = jsonMatch[0];
      let inString = false;
      let escapeNext = false;
      let result = '';
      
      for (let i = 0; i < fixed.length; i++) {
        const char = fixed[i];
        
        if (escapeNext) {
          // We're after a backslash - this character is already escaped
          result += char;
          escapeNext = false;
          continue;
        }
        
        if (char === '\\') {
          escapeNext = true;
          result += char;
          continue;
        }
        
        if (char === '"') {
          inString = !inString;
          result += char;
          continue;
        }
        
        if (inString) {
          // Inside a string - escape unescaped control characters
          const code = char.charCodeAt(0);
          if (code < 0x20) {
            // Control character - escape it based on type
            if (code === 0x0A) {
              result += '\\n';
            } else if (code === 0x0D) {
              result += '\\r';
            } else if (code === 0x09) {
              result += '\\t';
            } else if (code === 0x08) {
              result += '\\b';
            } else if (code === 0x0C) {
              result += '\\f';
            } else {
              result += `\\u${code.toString(16).padStart(4, '0')}`;
            }
          } else {
            result += char;
          }
        } else {
          result += char;
        }
      }
      
      return result;
    };

    let parsedResponse;
    try {
      // Try parsing directly first
      parsedResponse = JSON.parse(responseText);
    } catch (parseError: any) {
      console.log('Initial parse failed, attempting to fix control characters...');
      
      try {
        // Try fixing control characters
        const fixedJson = fixJsonControlChars(responseText);
        parsedResponse = JSON.parse(fixedJson);
      } catch (secondParseError: any) {
        // If that fails, try a simpler approach - just extract JSON and log for debugging
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            // Try one more time with the extracted JSON
            parsedResponse = JSON.parse(jsonMatch[0]);
          } catch (thirdParseError: any) {
            console.error('All JSON parsing attempts failed');
            console.error('Original error:', parseError.message);
            console.error('Response preview (first 1000 chars):', responseText.substring(0, 1000));
            throw new Error(`Could not parse JSON from Claude response: ${parseError.message}. The response may contain invalid control characters.`);
          }
        } else {
          throw new Error(`Could not find JSON object in response. Response preview: ${responseText.substring(0, 200)}...`);
        }
      }
    }

    // Validate response structure
    if (!parsedResponse.tabName || !parsedResponse.prototypeConfig) {
      throw new Error('Invalid response structure from Claude');
    }

    return NextResponse.json({
      tabName: parsedResponse.tabName,
      prototypeConfig: parsedResponse.prototypeConfig,
      prototypeCode: parsedResponse.prototypeCode || '',
    });
  } catch (error: any) {
    console.error('Error generating prototype:', error);
    console.error('Full error details:', JSON.stringify(error, null, 2));
    
    let errorMessage = error.message || 'Failed to generate prototype';
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


