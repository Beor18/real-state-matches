import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateViralContent } from '@/services/ai/openai-services'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()

    const body = await request.json()
    const { contentType, prompt, targetAudience, platform, propertyId } = body

    if (!contentType || !prompt) {
      return NextResponse.json(
        { success: false, error: 'contentType and prompt are required' },
        { status: 400 }
      )
    }

    // Validate content type
    const validTypes = ['post', 'story', 'video_script', 'live_script']
    if (!validTypes.includes(contentType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid content type' },
        { status: 400 }
      )
    }

    // Generate viral content using OpenAI
    const generatedContent = await generateViralContent({
      contentType,
      prompt,
      targetAudience: targetAudience || 'Inversionistas inmobiliarios en Puerto Rico',
      platform: platform || 'instagram',
    })

    // Save generated content to database if user is authenticated
    let savedContentId: string | null = null
    if (user) {
      const { data: savedContent, error: saveError } = await supabase
        .from('viral_content')
        .insert({
          user_id: user.id,
          content_type: contentType,
          title: generatedContent.hook.slice(0, 100) || 'Contenido Generado',
          content: generatedContent.content,
          hook: generatedContent.hook,
          hashtags: generatedContent.hashtags,
          target_audience: targetAudience || 'General',
          platform: platform || 'instagram',
          viral_score: generatedContent.viralScore,
          property_id: propertyId || null,
          status: 'draft',
        } as any)
        .select('id')
        .single()

      if (!saveError && savedContent) {
        savedContentId = (savedContent as any).id
      }
    }

    return NextResponse.json({
      success: true,
      content: {
        id: savedContentId,
        type: contentType,
        content: generatedContent.content,
        hook: generatedContent.hook,
        hashtags: generatedContent.hashtags,
        viralScore: generatedContent.viralScore,
        tips: generatedContent.tips,
        platform,
        targetAudience,
      },
      meta: {
        generatedAt: new Date().toISOString(),
        model: 'gpt-4o',
      },
    })
  } catch (error) {
    console.error('Error generating viral content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate content' },
      { status: 500 }
    )
  }
}

