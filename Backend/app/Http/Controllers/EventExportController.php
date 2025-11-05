<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\Event;
use App\Services\EventPdfExportService;
use App\Services\EventExcelExportService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class EventExportController extends Controller
{
    public function __construct(
        private readonly EventPdfExportService $pdfService,
        private readonly EventExcelExportService $excelService
    ) {
        $this->middleware('auth:api');
    }

    /**
     * Exportar evento a PDF
     */
    public function exportPdf(Event $event): Response|JsonResponse
    {
        try {
            $this->authorize('view', $event);

            $user = Auth::user();
            if ($user->institution_id !== $event->institution_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este evento.',
                ], 403);
            }

            $pdfContent = $this->pdfService->generateReport($event);

            return response($pdfContent, 200, [
                'Content-Type' => 'application/pdf',
                'Content-Disposition' => 'attachment; filename="reporte_evento_' . $event->id . '_' . now()->format('Y-m-d') . '.pdf"',
            ]);
        } catch (\Exception $e) {
            Log::error('Error exporting PDF', [
                'event_id' => $event->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al generar el reporte PDF: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exportar evento a Excel
     */
    public function exportExcel(Event $event): Response|JsonResponse
    {
        try {
            $this->authorize('view', $event);

            $user = Auth::user();
            if ($user->institution_id !== $event->institution_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'No tienes acceso a este evento.',
                ], 403);
            }

            $excelContent = $this->excelService->generateReport($event);

            return response($excelContent, 200, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'Content-Disposition' => 'attachment; filename="reporte_evento_' . $event->id . '_' . now()->format('Y-m-d') . '.xlsx"',
            ]);
        } catch (\Exception $e) {
            Log::error('Error exporting Excel', [
                'event_id' => $event->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al generar el reporte Excel: ' . $e->getMessage(),
            ], 500);
        }
    }
}

