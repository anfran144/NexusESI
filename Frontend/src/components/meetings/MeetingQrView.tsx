import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { QrCode, Download, Copy, Check } from 'lucide-react'
import { toast } from 'sonner'
import { meetingService, type Meeting } from '@/services/meeting.service'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import QRCode from 'qrcode'

interface MeetingQrViewProps {
  meeting: Meeting
}

export function MeetingQrView({ meeting }: MeetingQrViewProps) {
  const [qrImageUrl, setQrImageUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (meeting.qr_url) {
      generateQrCode(meeting.qr_url)
    }
  }, [meeting.qr_url])

  const generateQrCode = async (url: string) => {
    try {
      setLoading(true)
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
      })
      setQrImageUrl(qrDataUrl)
    } catch (error) {
      console.error('Error generating QR code:', error)
      toast.error('Error al generar el código QR')
    } finally {
      setLoading(false)
    }
  }

  const handleDownload = () => {
    if (!qrImageUrl) return

    const link = document.createElement('a')
    link.download = `qr-reunion-${meeting.id}.png`
    link.href = qrImageUrl
    link.click()
  }

  const handleCopyUrl = () => {
    if (!meeting.qr_url) return

    navigator.clipboard.writeText(meeting.qr_url)
    setCopied(true)
    toast.success('URL copiada al portapapeles')
    setTimeout(() => setCopied(false), 2000)
  }

  if (!meeting.has_qr_code || !meeting.qr_code) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground mb-4">No hay código QR disponible</p>
        <Button
          onClick={async () => {
            try {
              await meetingService.generateQr(meeting.id)
              toast.success('QR code generado exitosamente')
              // Recargar la reunión
              window.location.reload()
            } catch (error: any) {
              toast.error('Error al generar el QR code')
            }
          }}
        >
          Generar QR Code
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          {loading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
              <p className="text-sm text-muted-foreground">Generando QR...</p>
            </div>
          ) : qrImageUrl ? (
            <img
              src={qrImageUrl}
              alt="QR Code"
              className="w-64 h-64 border rounded-lg p-4 bg-white"
            />
          ) : (
            <div className="w-64 h-64 border rounded-lg flex items-center justify-center bg-muted">
              <QrCode className="h-16 w-16 text-muted-foreground" />
            </div>
          )}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">URL de Check-in:</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopyUrl}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copiado
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copiar
              </>
            )}
          </Button>
        </div>
        {meeting.qr_url && (
          <p className="text-xs text-muted-foreground break-all p-2 bg-muted rounded">
            {meeting.qr_url}
          </p>
        )}

        {meeting.qr_expires_at && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">Expira:</span>
            <Badge variant="outline">
              {format(new Date(meeting.qr_expires_at), "dd/MM/yyyy HH:mm", { locale: es })}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleDownload}
          disabled={!qrImageUrl}
        >
          <Download className="h-4 w-4 mr-2" />
          Descargar QR
        </Button>
        <Button
          variant="outline"
          className="flex-1"
          onClick={handleCopyUrl}
        >
          <Copy className="h-4 w-4 mr-2" />
          Copiar URL
        </Button>
      </div>
    </div>
  )
}


