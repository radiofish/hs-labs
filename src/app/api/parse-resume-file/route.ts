import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileType = file.type;
    const fileName = file.name.toLowerCase();
    let text = '';

    // Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse based on file type
    if (fileType === 'application/pdf' || fileName.endsWith('.pdf')) {
      try {
        // Dynamic import for pdf-parse to work with Turbopack
        // @ts-ignore - pdf-parse module structure varies between environments
        const pdfParseModule: any = await import('pdf-parse');
        // Handle both ESM and CommonJS module structures
        const pdfParse = typeof pdfParseModule === 'function' 
          ? pdfParseModule 
          : pdfParseModule.default || pdfParseModule;
        const pdfData = await pdfParse(buffer);
        text = pdfData.text;
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to parse PDF: ${error.message}` },
          { status: 400 }
        );
      }
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileName.endsWith('.docx')
    ) {
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to parse DOCX: ${error.message}` },
          { status: 400 }
        );
      }
    } else if (fileType === 'text/plain' || fileName.endsWith('.txt')) {
      text = buffer.toString('utf-8');
    } else if (
      fileType === 'application/msword' ||
      fileName.endsWith('.doc')
    ) {
      // Old .doc format - try to extract as text (basic approach)
      // Note: This is a simplified approach. For better .doc support, you'd need additional libraries
      try {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to parse DOC file. Please convert to PDF or DOCX, or paste the text directly. Error: ${error.message}` },
          { status: 400 }
        );
      }
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${fileType}. Supported formats: PDF, DOCX, DOC, TXT` },
        { status: 400 }
      );
    }

    if (!text || text.trim().length === 0) {
      return NextResponse.json(
        { error: 'No text could be extracted from the file. Please ensure the file contains readable text.' },
        { status: 400 }
      );
    }

    return NextResponse.json({ text: text.trim() });
  } catch (error: any) {
    console.error('Error parsing resume file:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to parse file' },
      { status: 500 }
    );
  }
}

