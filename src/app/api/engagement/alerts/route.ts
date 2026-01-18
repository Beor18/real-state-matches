import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    // Mock data for MVP
    const mockAlerts = [
      {
        id: '1',
        type: 'hot_zone',
        title: '🔥 Nueva Zona Hot Detectada',
        message: 'Río Piedras ha sido identificada como zona infravalorada con alto potencial de crecimiento (+35% en 3 años). Hay 12 propiedades disponibles con precios desde $185k.',
        priority: 'high' as const,
        isRead: false,
        createdAt: new Date(Date.now() - 300000).toISOString(),
        actionUrl: '/demand',
        actionLabel: 'Ver Análisis'
      },
      {
        id: '2',
        type: 'price_drop',
        title: '📉 Precio Reducido - Villa Dorado',
        message: 'La Villa Costera Moderna en Dorado ha reducido su precio de $525k a $485k. Excelente oportunidad para inversión.',
        priority: 'urgent' as const,
        isRead: false,
        createdAt: new Date(Date.now() - 900000).toISOString(),
        actionUrl: '/lifestyle',
        actionLabel: 'Ver Propiedad'
      },
      {
        id: '3',
        type: 'new_listing',
        title: '🏠 Nuevo Listado Premium',
        message: 'Penthouse en Condado con vistas panorámicas al mar disponible. Precio: $625k. Predicción de valor a 5 años: $937k.',
        priority: 'medium' as const,
        isRead: true,
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: '4',
        type: 'viral_content',
        title: '✨ Contenido Viral Generado',
        message: 'Hemos generado nuevo contenido viral sobre inversiones en Puerto Rico. Score viral: 94%. Alcance estimado: 245k.',
        priority: 'low' as const,
        isRead: true,
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ]

    let filteredAlerts = mockAlerts

    if (unreadOnly) {
      filteredAlerts = filteredAlerts.filter(alert => !alert.isRead)
    }

    return NextResponse.json({
      success: true,
      alerts: filteredAlerts,
      meta: {
        total: mockAlerts.length,
        returned: filteredAlerts.length,
        unread: mockAlerts.filter(a => !a.isRead).length
      }
    })
  } catch (error) {
    console.error('Error fetching alerts:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch alerts'
      },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { alertId, action } = body

    if (!alertId) {
      return NextResponse.json(
        {
          success: false,
          error: 'alertId is required'
        },
        { status: 400 }
      )
    }

    // In a real implementation, this would:
    // 1. Update the alert in the database
    // 2. Mark as read or delete based on action
    // 3. Return updated alert

    return NextResponse.json({
      success: true,
      message: `Alert ${action === 'markRead' ? 'marked as read' : action === 'delete' ? 'deleted' : 'updated'}`,
      alertId,
      action
    })
  } catch (error) {
    console.error('Error updating alert:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update alert'
      },
      { status: 500 }
    )
  }
}
