<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Event;
use App\Libraries\CustomTCPDF;

final class EventPdfExportService
{
    /**
     * Generar reporte PDF del evento
     */
    public function generateReport(Event $event): string
    {
        // Cargar relaciones necesarias
        $event->load([
            'coordinator',
            'institution',
            'committees.users',
            'committees.tasks',
            'tasks.assignedTo',
            'tasks.committee',
            'tasks.incidents.reportedBy',
            'tasks.alerts',
        ]);

        // Crear instancia de TCPDF personalizada
        $pdf = new CustomTCPDF('P', 'mm', 'A4', true, 'UTF-8', false);

        // Configuración del documento
        $pdf->SetCreator('NexusESI');
        $pdf->SetAuthor('NexusESI System');
        $pdf->SetTitle('Reporte del Evento: ' . $event->name);
        $pdf->SetSubject('Reporte Detallado de Evento');

        // Configurar márgenes según normativas (2.5 cm = 25 mm)
        $pdf->SetMargins(25, 25, 25);
        $pdf->SetHeaderMargin(20);
        $pdf->SetFooterMargin(20);

        // Configurar fuente según normativas (Roboto o Helvetica como alternativa)
        $pdf->SetFont('helvetica', '', 11); // 11pt para cuerpo

        // Auto page break
        $pdf->SetAutoPageBreak(true, 25);

        // Configurar footer personalizado
        $pdf->setPrintFooter(true);
        $pdf->setFooterFont(['helvetica', '', 9]); // 9pt para pie de página

        // Agregar página
        $pdf->AddPage();

        // Generar encabezado
        $this->addHeader($pdf, $event);

        // Generar resumen ejecutivo
        $this->addExecutiveSummary($pdf, $event);

        // Generar gráficos de métricas
        $this->addMetricsCharts($pdf, $event);

        // Generar sección de tareas
        $this->addTasksSection($pdf, $event);

        // Generar sección de comités
        $this->addCommitteesSection($pdf, $event);

        // Generar sección de incidencias
        $this->addIncidentsSection($pdf, $event);

        // Retornar el PDF como string
        return $pdf->Output('', 'S');
    }

    /**
     * Agregar encabezado al PDF
     */
    private function addHeader(CustomTCPDF $pdf, Event $event): void
    {
        // Logo y título principal (izquierda)
        $pdf->SetFont('helvetica', 'B', 18); // 18pt según normativa
        $pdf->Cell(0, 10, 'Reporte Detallado de Tareas', 0, 1, 'L');

        // Información del evento (derecha)
        $pdf->SetFont('helvetica', '', 11);
        $pdf->SetY(25);
        $pdf->Cell(0, 6, 'Evento: ' . $event->name, 0, 1, 'R');
        $pdf->Cell(0, 6, 'Institución: ' . ($event->institution->nombre ?? 'N/A'), 0, 1, 'R');

        // Línea separadora
        $pdf->SetY(42);
        $pdf->SetDrawColor(200, 200, 200);
        $pageWidth = $pdf->getPageWidth();
        $pdf->Line(25, $pdf->GetY(), $pageWidth - 25, $pdf->GetY());

        // Espacio después del encabezado
        $pdf->SetY($pdf->GetY() + 8);
    }

    /**
     * Agregar resumen ejecutivo
     */
    private function addExecutiveSummary(CustomTCPDF $pdf, Event $event): void
    {
        $pdf->SetFont('helvetica', 'B', 14); // 14pt para títulos de sección
        $pdf->SetFillColor(245, 245, 245);
        $pdf->Cell(0, 8, 'Resumen Ejecutivo', 0, 1, 'L', true);

        $pdf->SetFont('helvetica', '', 11);
        $pdf->Ln(3);

        // Información básica del evento con interlineado mejorado
        $lineHeight = 7; // 1.25 interlineado aproximado

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(50, $lineHeight, 'Nombre del Evento:', 0, 0);
        $pdf->SetFont('helvetica', '', 11);
        $pdf->MultiCell(0, $lineHeight, $event->name, 0, 'L');

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(50, $lineHeight, 'Descripción:', 0, 0);
        $pdf->SetFont('helvetica', '', 11);
        $pdf->MultiCell(0, $lineHeight, $event->description, 0, 'L');

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(50, $lineHeight, 'Fecha de Inicio:', 0, 0);
        $pdf->SetFont('helvetica', '', 11);
        $pdf->Cell(0, $lineHeight, $event->start_date->format('d/m/Y'), 0, 1);

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(50, $lineHeight, 'Fecha de Fin:', 0, 0);
        $pdf->SetFont('helvetica', '', 11);
        $pdf->Cell(0, $lineHeight, $event->end_date->format('d/m/Y'), 0, 1);

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(50, $lineHeight, 'Coordinador:', 0, 0);
        $pdf->SetFont('helvetica', '', 11);
        $coordinatorName = $event->coordinator->name ?? 'N/A';
        $coordinatorRole = method_exists($event->coordinator, 'getRoleNames') 
            ? ' - ' . $event->coordinator->getRoleNames()->first() 
            : '';
        $pdf->Cell(0, $lineHeight, $coordinatorName . $coordinatorRole, 0, 1);

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(50, $lineHeight, 'Estado:', 0, 0);
        $pdf->SetFont('helvetica', '', 11);
        $pdf->Cell(0, $lineHeight, ucfirst($event->status), 0, 1);

        // Estadísticas
        $totalTasks = $event->tasks->count();
        $completedTasks = $event->tasks->where('status', 'Completed')->count();
        $progressPercentage = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        $pdf->Ln(3);
        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(50, $lineHeight, 'Tareas Totales:', 0, 0);
        $pdf->SetFont('helvetica', '', 11);
        $pdf->Cell(0, $lineHeight, (string) $totalTasks, 0, 1);

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(50, $lineHeight, 'Tareas Completadas:', 0, 0);
        $pdf->SetFont('helvetica', '', 11);
        $pdf->Cell(0, $lineHeight, (string) $completedTasks, 0, 1);

        $pdf->SetFont('helvetica', 'B', 11);
        $pdf->Cell(50, $lineHeight, 'Progreso General:', 0, 0);
        $pdf->SetFont('helvetica', '', 11);
        $pdf->Cell(0, $lineHeight, $progressPercentage . '%', 0, 1);

        $pdf->Ln(8);
    }

    /**
     * Agregar sección de tareas con tabla mejorada
     */
    private function addTasksSection(CustomTCPDF $pdf, Event $event): void
    {
        // Verificar si necesitamos nueva página
        if ($pdf->GetY() > 220) {
            $pdf->AddPage();
        }

        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->SetFillColor(245, 245, 245);
        $pdf->Cell(0, 8, 'Listado de Tareas', 0, 1, 'L', true);

        $pdf->Ln(3);

        // Anchos ajustados para caber en la página (ancho total disponible: 160mm)
        $colWidths = [
            'id' => 12,      // ID
            'title' => 45,   // Título
            'status' => 25,  // Estado
            'risk' => 20,    // Riesgo
            'date' => 28,    // Fecha Límite
            'assigned' => 30 // Asignado a
        ];

        // Función para dibujar encabezados de tabla
        $drawHeaders = function() use ($pdf, $colWidths) {
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->SetFillColor(230, 230, 230);
            $pdf->Cell($colWidths['id'], 7, 'ID', 1, 0, 'C', true);
            $pdf->Cell($colWidths['title'], 7, 'Título', 1, 0, 'L', true);
            $pdf->Cell($colWidths['status'], 7, 'Estado', 1, 0, 'C', true);
            $pdf->Cell($colWidths['risk'], 7, 'Riesgo', 1, 0, 'C', true);
            $pdf->Cell($colWidths['date'], 7, 'Fecha Límite', 1, 0, 'C', true);
            $pdf->Cell($colWidths['assigned'], 7, 'Asignado a', 1, 1, 'L', true);
        };

        // Dibujar encabezados iniciales
        $drawHeaders();

        // Filas de datos con colores alternados
        $fill = false;
        $pdf->SetFont('helvetica', '', 10); // 10pt para tablas según normativa

        foreach ($event->tasks as $task) {
            // Verificar si necesitamos nueva página ANTES de dibujar la fila
            if ($pdf->GetY() > 260) {
                $pdf->AddPage();
                $drawHeaders();
                $fill = false;
            }

            $pdf->SetFillColor($fill ? 250 : 255, $fill ? 250 : 255, $fill ? 250 : 255);
            $fill = !$fill;

            // Calcular altura necesaria para el título (puede ser multilínea)
            $titleText = $this->truncateText($task->title, 30);
            $assignedText = $this->truncateText($task->assignedTo?->name ?? 'Sin asignar', 20);
            
            $rowHeight = 6;

            // ID
            $pdf->Cell($colWidths['id'], $rowHeight, (string) $task->id, 1, 0, 'C', true);
            
            // Título (truncado si es muy largo)
            $pdf->Cell($colWidths['title'], $rowHeight, $titleText, 1, 0, 'L', true);

            // Estado con color
            $statusColor = $this->getStatusColor($task->status);
            $pdf->SetTextColor($statusColor['r'], $statusColor['g'], $statusColor['b']);
            $pdf->Cell($colWidths['status'], $rowHeight, $this->translateStatus($task->status), 1, 0, 'C', true);
            $pdf->SetTextColor(0, 0, 0);

            // Riesgo
            $riskColor = $this->getRiskColor($task->risk_level);
            $pdf->SetTextColor($riskColor['r'], $riskColor['g'], $riskColor['b']);
            $pdf->Cell($colWidths['risk'], $rowHeight, $this->translateRisk($task->risk_level ?? 'N/A'), 1, 0, 'C', true);
            $pdf->SetTextColor(0, 0, 0);

            // Fecha
            $pdf->Cell($colWidths['date'], $rowHeight, $task->due_date ? $task->due_date->format('d/m/Y') : 'N/A', 1, 0, 'C', true);
            
            // Asignado
            $pdf->Cell($colWidths['assigned'], $rowHeight, $assignedText, 1, 1, 'L', true);
        }

        $pdf->Ln(8);
    }

    /**
     * Agregar sección de comités
     */
    private function addCommitteesSection(CustomTCPDF $pdf, Event $event): void
    {
        if ($pdf->GetY() > 220) {
            $pdf->AddPage();
        }

        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->SetFillColor(245, 245, 245);
        $pdf->Cell(0, 8, 'Comités del Evento', 0, 1, 'L', true);

        $pdf->Ln(3);

        foreach ($event->committees as $committee) {
            // Verificar espacio disponible
            if ($pdf->GetY() > 250) {
                $pdf->AddPage();
            }

            $pdf->SetFont('helvetica', 'B', 12);
            $pdf->Cell(0, 6, 'Comité: ' . $committee->name, 0, 1);

            $pdf->SetFont('helvetica', '', 11);
            $members = $committee->users->pluck('name')->implode(', ');
            $members = $members ?: 'Sin miembros asignados';
            
            $pdf->MultiCell(0, 6, 'Miembros: ' . $members, 0, 'L');
            $pdf->Cell(0, 6, 'Tareas asignadas: ' . $committee->tasks->count(), 0, 1);
            $pdf->Ln(3);
        }

        $pdf->Ln(5);
    }

    /**
     * Agregar sección de incidencias
     */
    private function addIncidentsSection(CustomTCPDF $pdf, Event $event): void
    {
        $incidents = $event->tasks->flatMap->incidents;

        if ($incidents->isEmpty()) {
            return;
        }

        if ($pdf->GetY() > 200) {
            $pdf->AddPage();
        }

        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->SetFillColor(245, 245, 245);
        $pdf->Cell(0, 8, 'Incidencias Reportadas', 0, 1, 'L', true);

        $pdf->Ln(3);

        // Anchos ajustados (total: 160mm)
        $colWidths = [
            'id' => 12,
            'task_id' => 20,
            'description' => 68,
            'status' => 25,
            'reporter' => 35
        ];

        // Función para encabezados
        $drawHeaders = function() use ($pdf, $colWidths) {
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->SetFillColor(230, 230, 230);
            $pdf->Cell($colWidths['id'], 7, 'ID', 1, 0, 'C', true);
            $pdf->Cell($colWidths['task_id'], 7, 'Tarea ID', 1, 0, 'C', true);
            $pdf->Cell($colWidths['description'], 7, 'Descripción', 1, 0, 'L', true);
            $pdf->Cell($colWidths['status'], 7, 'Estado', 1, 0, 'C', true);
            $pdf->Cell($colWidths['reporter'], 7, 'Reportado por', 1, 1, 'L', true);
        };

        $drawHeaders();

        $pdf->SetFont('helvetica', '', 10);
        $fill = false;

        foreach ($incidents as $incident) {
            if ($pdf->GetY() > 260) {
                $pdf->AddPage();
                $drawHeaders();
                $fill = false;
            }

            $pdf->SetFillColor($fill ? 250 : 255, $fill ? 250 : 255, $fill ? 250 : 255);
            $fill = !$fill;

            // Limpiar HTML de la descripción
            $description = strip_tags($incident->description);
            $description = $this->truncateText($description, 50);

            $pdf->Cell($colWidths['id'], 6, (string) $incident->id, 1, 0, 'C', true);
            $pdf->Cell($colWidths['task_id'], 6, (string) $incident->task_id, 1, 0, 'C', true);
            $pdf->Cell($colWidths['description'], 6, $description, 1, 0, 'L', true);
            
            // Estado con color
            $statusColor = $incident->status === 'Resolved' 
                ? ['r' => 0, 'g' => 128, 'b' => 0] 
                : ['r' => 220, 'g' => 20, 'b' => 60];
            $pdf->SetTextColor($statusColor['r'], $statusColor['g'], $statusColor['b']);
            $pdf->Cell($colWidths['status'], 6, $this->translateIncidentStatus($incident->status), 1, 0, 'C', true);
            $pdf->SetTextColor(0, 0, 0);
            
            $pdf->Cell($colWidths['reporter'], 6, $this->truncateText($incident->reportedBy?->name ?? 'N/A', 22), 1, 1, 'L', true);
        }

        $pdf->Ln(8);
    }

    /**
     * Agregar gráficos de métricas al PDF
     */
    private function addMetricsCharts(CustomTCPDF $pdf, Event $event): void
    {
        if ($pdf->GetY() > 180) {
            $pdf->AddPage();
        }

        $pdf->SetFont('helvetica', 'B', 14);
        $pdf->SetFillColor(245, 245, 245);
        $pdf->Cell(0, 8, 'Análisis de Métricas y Gráficos', 0, 1, 'L', true);

        $pdf->Ln(3);

        // Calcular métricas
        $metrics = $this->calculateAdvancedMetrics($event);

        // Análisis textual
        $this->addMetricsAnalysis($pdf, $metrics, $event);

        // Gráficos
        $this->drawTaskStatusBarChart($pdf, $metrics);
        $this->drawCommitteeProgressChart($pdf, $event);
        $this->drawWorkloadChart($pdf, $event);

        $pdf->Ln(8);
    }

    /**
     * Calcular métricas avanzadas del evento
     */
    private function calculateAdvancedMetrics(Event $event): array
    {
        $tasks = $event->tasks;

        $totalTasks = $tasks->count();
        $completedTasks = $tasks->where('status', 'Completed')->count();
        $inProgressTasks = $tasks->where('status', 'InProgress')->count();
        $pendingTasks = $tasks->where('status', 'Pending')->count();
        $delayedTasks = $tasks->where('status', 'Delayed')->count();
        $pausedTasks = $tasks->where('status', 'Paused')->count();

        $incidents = $event->tasks->flatMap->incidents;
        $openIncidents = $incidents->where('status', 'Reported')->count();
        $resolvedIncidents = $incidents->where('status', 'Resolved')->count();

        $alerts = $event->tasks->flatMap->alerts;
        $criticalAlerts = $alerts->where('type', 'Critical')->count();
        $preventiveAlerts = $alerts->where('type', 'Preventive')->count();

        return [
            'total_tasks' => $totalTasks,
            'completed_tasks' => $completedTasks,
            'in_progress_tasks' => $inProgressTasks,
            'pending_tasks' => $pendingTasks,
            'delayed_tasks' => $delayedTasks,
            'paused_tasks' => $pausedTasks,
            'critical_alerts' => $criticalAlerts,
            'preventive_alerts' => $preventiveAlerts,
            'open_incidents' => $openIncidents,
            'resolved_incidents' => $resolvedIncidents,
        ];
    }

    /**
     * Dibujar gráfico de barras de distribución de estados
     */
    private function drawTaskStatusBarChart(CustomTCPDF $pdf, array $metrics): void
    {
        if ($pdf->GetY() > 200) {
            $pdf->AddPage();
        }

        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 6, 'Distribución de Estados de Tareas', 0, 1, 'L');
        $pdf->Ln(2);

        $startY = $pdf->GetY();
        $chartHeight = 50;
        $chartWidth = 140;
        $startX = 30;
        $barWidth = 22;
        $spacing = 4;

        $data = [
            ['label' => 'Completas', 'value' => $metrics['completed_tasks'], 'color' => [0, 128, 0]],
            ['label' => 'En Progreso', 'value' => $metrics['in_progress_tasks'], 'color' => [255, 165, 0]],
            ['label' => 'Pendientes', 'value' => $metrics['pending_tasks'], 'color' => [128, 128, 128]],
            ['label' => 'Retrasadas', 'value' => $metrics['delayed_tasks'], 'color' => [220, 20, 60]],
            ['label' => 'Pausadas', 'value' => $metrics['paused_tasks'], 'color' => [200, 200, 200]],
        ];

        $values = array_column($data, 'value');
        $maxValue = !empty($values) && max($values) > 0 ? max($values) : 1;

        $xPos = $startX;
        foreach ($data as $item) {
            $barHeight = ($item['value'] / $maxValue) * $chartHeight;

            $pdf->SetFillColor($item['color'][0], $item['color'][1], $item['color'][2]);
            $pdf->Rect($xPos, $startY + $chartHeight - $barHeight, $barWidth, $barHeight, 'F');

            // Valor
            $pdf->SetFont('helvetica', 'B', 9);
            $pdf->SetXY($xPos, $startY + $chartHeight + 1);
            $pdf->Cell($barWidth, 4, (string) $item['value'], 0, 0, 'C');

            // Etiqueta
            $pdf->SetFont('helvetica', '', 8);
            $pdf->SetXY($xPos, $startY + $chartHeight + 5);
            $pdf->Cell($barWidth, 4, $item['label'], 0, 0, 'C');

            $xPos += $barWidth + $spacing;
        }

        $pdf->SetY($startY + $chartHeight + 12);
    }

    /**
     * Dibujar gráfico de progreso por comité
     */
    private function drawCommitteeProgressChart(CustomTCPDF $pdf, Event $event): void
    {
        if ($pdf->GetY() > 200) {
            $pdf->AddPage();
        }

        $committees = $event->committees;
        if ($committees->isEmpty()) {
            return;
        }

        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 6, 'Progreso por Comité', 0, 1, 'L');
        $pdf->Ln(2);

        $startY = $pdf->GetY();
        $barMaxWidth = 100;
        $startX = 30;
        $barHeight = 6;

        foreach ($committees->take(5) as $committee) {
            $tasks = $committee->tasks;
            $total = $tasks->count();
            $completed = $tasks->where('status', 'Completed')->count();
            $progress = $total > 0 ? round(($completed / $total) * 100, 1) : 0;

            // Nombre del comité
            $pdf->SetFont('helvetica', '', 9);
            $pdf->SetXY($startX, $startY);
            $pdf->Cell(40, $barHeight, $this->truncateText($committee->name, 18), 0, 0, 'L');

            // Barra de progreso
            $barWidth = ($progress / 100) * $barMaxWidth;
            $pdf->SetFillColor(59, 130, 246);
            $pdf->Rect($startX + 40, $startY + 1, $barWidth, 4, 'F');

            // Porcentaje
            $pdf->SetFont('helvetica', 'B', 9);
            $pdf->SetXY($startX + 40 + $barMaxWidth + 2, $startY);
            $pdf->Cell(15, $barHeight, $progress . '%', 0, 0, 'L');

            $startY += 8;
        }

        $pdf->SetY($startY + 3);
    }

    /**
     * Dibujar gráfico de carga de trabajo
     */
    private function drawWorkloadChart(CustomTCPDF $pdf, Event $event): void
    {
        if ($pdf->GetY() > 200) {
            $pdf->AddPage();
        }

        $tasks = $event->tasks->whereNotNull('assigned_to_id');
        $workloadByUser = $tasks->groupBy('assigned_to_id')->map(function ($userTasks) {
            $user = $userTasks->first()->assignedTo;
            return [
                'name' => $user->name ?? 'Sin nombre',
                'total' => $userTasks->count(),
                'completed' => $userTasks->where('status', 'Completed')->count(),
                'pending' => $userTasks->whereNotIn('status', ['Completed'])->count(),
            ];
        })->sortByDesc('total')->take(5);

        if ($workloadByUser->isEmpty()) {
            return;
        }

        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 6, 'Distribución de Carga de Trabajo (Top 5)', 0, 1, 'L');
        $pdf->Ln(2);

        $startY = $pdf->GetY();
        $chartHeight = 45;
        $startX = 30;
        $barWidth = 22;
        $spacing = 4;

        $maxTasks = $workloadByUser->max('total') ?: 1;

        $xPos = $startX;
        foreach ($workloadByUser as $userData) {
            $totalHeight = ($userData['total'] / $maxTasks) * $chartHeight;
            $completedHeight = ($userData['completed'] / $maxTasks) * $chartHeight;
            $pendingHeight = ($userData['pending'] / $maxTasks) * $chartHeight;

            // Barra pendientes (naranja)
            $pdf->SetFillColor(245, 158, 11);
            $pdf->Rect($xPos, $startY + $chartHeight - $pendingHeight, $barWidth, $pendingHeight, 'F');

            // Barra completadas (verde) - apilada
            $pdf->SetFillColor(34, 197, 94);
            $pdf->Rect($xPos, $startY + $chartHeight - $totalHeight, $barWidth, $completedHeight, 'F');

            // Valor total
            $pdf->SetFont('helvetica', 'B', 8);
            $pdf->SetXY($xPos, $startY + $chartHeight + 1);
            $pdf->Cell($barWidth, 4, (string) $userData['total'], 0, 0, 'C');

            // Nombre
            $pdf->SetFont('helvetica', '', 7);
            $pdf->SetXY($xPos - 2, $startY + $chartHeight + 5);
            $pdf->Cell($barWidth + 4, 4, $this->truncateText($userData['name'], 12), 0, 0, 'C');

            $xPos += $barWidth + $spacing;
        }

        // Leyenda
        $pdf->SetFont('helvetica', '', 8);
        $legendY = $startY + $chartHeight + 10;
        
        $pdf->SetFillColor(34, 197, 94);
        $pdf->Rect($startX, $legendY, 3, 3, 'F');
        $pdf->SetXY($startX + 4, $legendY);
        $pdf->Cell(25, 3, 'Completadas', 0, 0, 'L');

        $pdf->SetFillColor(245, 158, 11);
        $pdf->Rect($startX + 35, $legendY, 3, 3, 'F');
        $pdf->SetXY($startX + 39, $legendY);
        $pdf->Cell(25, 3, 'Pendientes', 0, 0, 'L');

        $pdf->SetY($legendY + 8);
    }

    /**
     * Agregar análisis textual de métricas
     */
    private function addMetricsAnalysis(CustomTCPDF $pdf, array $metrics, Event $event): void
    {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 6, 'Análisis de Métricas', 0, 1, 'L');
        $pdf->SetFont('helvetica', '', 10);
        $pdf->Ln(2);

        $totalTasks = $metrics['total_tasks'];
        $completionRate = $totalTasks > 0 ? round(($metrics['completed_tasks'] / $totalTasks) * 100, 1) : 0;

        // Análisis de rendimiento
        $pdf->SetFont('helvetica', 'B', 10);
        $pdf->Cell(0, 5, 'Rendimiento General:', 0, 1, 'L');
        $pdf->SetFont('helvetica', '', 10);

        if ($completionRate >= 80) {
            $performance = 'Excelente';
            $color = [0, 128, 0];
        } elseif ($completionRate >= 60) {
            $performance = 'Bueno';
            $color = [0, 128, 0];
        } elseif ($completionRate >= 40) {
            $performance = 'Regular';
            $color = [255, 165, 0];
        } else {
            $performance = 'Requiere Atención';
            $color = [220, 20, 60];
        }

        $pdf->SetTextColor($color[0], $color[1], $color[2]);
        $pdf->MultiCell(0, 5, "El evento muestra un rendimiento {$performance} con un {$completionRate}% de tareas completadas.", 0, 'L');
        $pdf->SetTextColor(0, 0, 0);

        // Análisis de incidencias
        if ($metrics['open_incidents'] > 0) {
            $pdf->SetFont('helvetica', 'B', 10);
            $pdf->Cell(0, 5, 'Análisis de Incidencias:', 0, 1, 'L');
            $pdf->SetFont('helvetica', '', 10);
            $pdf->SetTextColor(220, 20, 60);
            $pdf->MultiCell(0, 5, "⚠️ Hay {$metrics['open_incidents']} incidencias abiertas sin resolver.", 0, 'L');
            $pdf->SetTextColor(0, 0, 0);
        }

        $pdf->Ln(3);
    }

    /**
     * Utilidad: Truncar texto
     */
    private function truncateText(string $text, int $maxLength): string
    {
        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }
        return mb_substr($text, 0, $maxLength - 3) . '...';
    }

    /**
     * Traducir estados al español
     */
    private function translateStatus(string $status): string
    {
        return match ($status) {
            'Completed' => 'Completada',
            'InProgress' => 'En Progreso',
            'Pending' => 'Pendiente',
            'Delayed' => 'Retrasada',
            'Paused' => 'Pausada',
            default => $status,
        };
    }

    /**
     * Traducir niveles de riesgo
     */
    private function translateRisk(?string $risk): string
    {
        return match ($risk) {
            'Low' => 'Bajo',
            'Medium' => 'Medio',
            'High' => 'Alto',
            default => 'N/A',
        };
    }

    /**
     * Traducir estado de incidencias
     */
    private function translateIncidentStatus(string $status): string
    {
        return match ($status) {
            'Reported' => 'Reportada',
            'Resolved' => 'Resuelta',
            default => $status,
        };
    }

    /**
     * Obtener color según estado
     */
    private function getStatusColor(string $status): array
    {
        return match ($status) {
            'Completed' => ['r' => 0, 'g' => 128, 'b' => 0],
            'InProgress' => ['r' => 255, 'g' => 165, 'b' => 0],
            'Delayed' => ['r' => 220, 'g' => 20, 'b' => 60],
            'Paused' => ['r' => 128, 'g' => 128, 'b' => 128],
            default => ['r' => 0, 'g' => 0, 'b' => 0],
        };
    }

    /**
     * Obtener color según nivel de riesgo
     */
    private function getRiskColor(?string $riskLevel): array
    {
        return match ($riskLevel) {
            'Low' => ['r' => 0, 'g' => 128, 'b' => 0],
            'Medium' => ['r' => 255, 'g' => 165, 'b' => 0],
            'High' => ['r' => 220, 'g' => 20, 'b' => 60],
            default => ['r' => 128, 'g' => 128, 'b' => 128],
        };
    }
}
