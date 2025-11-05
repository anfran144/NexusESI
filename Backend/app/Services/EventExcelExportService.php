<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Event;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Style\Border;
use PhpOffice\PhpSpreadsheet\Style\Font;

final class EventExcelExportService
{
    /**
     * Generar reporte Excel del evento
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

        // Crear nuevo Spreadsheet
        $spreadsheet = new Spreadsheet();

        // Eliminar hoja por defecto si hay más de una
        $spreadsheet->removeSheetByIndex(0);

        // Crear pestaña de Resumen (opcional, con diseño)
        $this->createSummarySheet($spreadsheet, $event);

        // Crear pestaña de Tareas (datos crudos)
        $this->createTasksSheet($spreadsheet, $event);

        // Crear pestaña de Comités y Miembros
        $this->createCommitteesSheet($spreadsheet, $event);

        // Crear pestaña de Incidencias y Alertas
        $this->createIncidentsAlertsSheet($spreadsheet, $event);

        // Guardar en memoria
        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'nexusesi_export_');
        $writer->save($tempFile);

        // Leer el contenido
        $content = file_get_contents($tempFile);
        unlink($tempFile);

        return $content;
    }

    /**
     * Crear pestaña de Resumen (única con diseño)
     */
    private function createSummarySheet(Spreadsheet $spreadsheet, Event $event): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Resumen');

        // Información básica del evento
        $row = 1;
        $sheet->setCellValue('A' . $row, 'Reporte del Evento');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true)->setSize(14);
        $row += 2;

        $sheet->setCellValue('A' . $row, 'Nombre del Evento:');
        $sheet->setCellValue('B' . $row, $event->name);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Institución:');
        $sheet->setCellValue('B' . $row, $event->institution->nombre ?? 'N/A');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Coordinador:');
        $sheet->setCellValue('B' . $row, $event->coordinator->name ?? 'N/A');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Fecha de Inicio:');
        $sheet->setCellValue('B' . $row, $event->start_date->format('Y-m-d'));
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Fecha de Fin:');
        $sheet->setCellValue('B' . $row, $event->end_date->format('Y-m-d'));
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Estado:');
        $sheet->setCellValue('B' . $row, ucfirst($event->status));
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row += 2;

        // Estadísticas
        $totalTasks = $event->tasks->count();
        $completedTasks = $event->tasks->where('status', 'Completed')->count();
        $inProgressTasks = $event->tasks->where('status', 'InProgress')->count();
        $delayedTasks = $event->tasks->where('status', 'Delayed')->count();
        $progressPercentage = $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100, 1) : 0;

        $sheet->setCellValue('A' . $row, 'Estadísticas');
        $sheet->getStyle('A' . $row)->getFont()->setBold(true)->setSize(12);
        $row++;

        $sheet->setCellValue('A' . $row, 'Tareas Totales:');
        $sheet->setCellValue('B' . $row, $totalTasks);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Tareas Completadas:');
        $sheet->setCellValue('B' . $row, $completedTasks);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Tareas en Progreso:');
        $sheet->setCellValue('B' . $row, $inProgressTasks);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Tareas Retrasadas:');
        $sheet->setCellValue('B' . $row, $delayedTasks);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);
        $row++;

        $sheet->setCellValue('A' . $row, 'Progreso General (%):');
        $sheet->setCellValue('B' . $row, $progressPercentage);
        $sheet->getStyle('A' . $row)->getFont()->setBold(true);

        // Ajustar ancho de columnas
        $sheet->getColumnDimension('A')->setWidth(25);
        $sheet->getColumnDimension('B')->setWidth(40);
    }

    /**
     * Crear pestaña de Tareas (datos crudos - sin celdas combinadas)
     */
    private function createTasksSheet(Spreadsheet $spreadsheet, Event $event): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Tareas_RawData');

        // Fila 1: Encabezados (SIEMPRE en negrita)
        $headers = [
            'ID_Tarea',
            'Nombre_Tarea',
            'Descripcion',
            'Estado',
            'Nivel_Riesgo',
            'Fecha_Limite',
            'Comite_Asignado',
            'Asignado_A',
            'Fecha_Creacion',
            'Fecha_Actualizacion',
            'Fecha_Completada',
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getStyle($col . '1')->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('E0E0E0');
            $col++;
        }

        // Datos de tareas
        $row = 2;
        foreach ($event->tasks as $task) {
            $sheet->setCellValue('A' . $row, $task->id);
            $sheet->setCellValue('B' . $row, $task->title);
            $sheet->setCellValue('C' . $row, $task->description);
            $sheet->setCellValue('D' . $row, $task->status);
            $sheet->setCellValue('E' . $row, $task->risk_level ?? '');
            // Formato ISO para fechas (YYYY-MM-DD)
            $sheet->setCellValue('F' . $row, $task->due_date ? $task->due_date->format('Y-m-d') : '');
            $sheet->setCellValue('G' . $row, $task->committee->name ?? '');
            $sheet->setCellValue('H' . $row, $task->assignedTo?->name ?? 'Sin asignar');
            $sheet->setCellValue('I' . $row, $task->created_at->format('Y-m-d H:i:s'));
            $sheet->setCellValue('J' . $row, $task->updated_at->format('Y-m-d H:i:s'));
            // Fecha de completada: si el estado es Completed, usar updated_at
            $sheet->setCellValue('K' . $row, $task->status === 'Completed' ? $task->updated_at->format('Y-m-d H:i:s') : '');
            $row++;
        }

        // Inmovilizar paneles (Freeze Panes) en la fila 1
        $sheet->freezePane('A2');

        // Aplicar filtro automático
        $sheet->setAutoFilter('A1:K' . ($row - 1));

        // Ajustar ancho de columnas
        $sheet->getColumnDimension('A')->setWidth(10);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(40);
        $sheet->getColumnDimension('D')->setWidth(15);
        $sheet->getColumnDimension('E')->setWidth(15);
        $sheet->getColumnDimension('F')->setWidth(15);
        $sheet->getColumnDimension('G')->setWidth(25);
        $sheet->getColumnDimension('H')->setWidth(25);
        $sheet->getColumnDimension('I')->setWidth(20);
        $sheet->getColumnDimension('J')->setWidth(20);
        $sheet->getColumnDimension('K')->setWidth(20);
    }

    /**
     * Crear pestaña de Comités y Miembros
     */
    private function createCommitteesSheet(Spreadsheet $spreadsheet, Event $event): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Comites_Miembros');

        // Encabezados
        $headers = [
            'ID_Comite',
            'Nombre_Comite',
            'ID_Evento',
            'Nombre_Evento',
            'ID_Miembro',
            'Nombre_Miembro',
            'Email_Miembro',
            'Fecha_Asignacion',
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getStyle($col . '1')->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('E0E0E0');
            $col++;
        }

        // Datos
        $row = 2;
        foreach ($event->committees as $committee) {
            foreach ($committee->users as $user) {
                $sheet->setCellValue('A' . $row, $committee->id);
                $sheet->setCellValue('B' . $row, $committee->name);
                $sheet->setCellValue('C' . $row, $event->id);
                $sheet->setCellValue('D' . $row, $event->name);
                $sheet->setCellValue('E' . $row, $user->id);
                $sheet->setCellValue('F' . $row, $user->name);
                $sheet->setCellValue('G' . $row, $user->email);
                $sheet->setCellValue('H' . $row, $user->pivot->assigned_at ?? '');
                $row++;
            }
        }

        // Inmovilizar paneles
        $sheet->freezePane('A2');

        // Aplicar filtro automático
        $sheet->setAutoFilter('A1:H' . ($row - 1));

        // Ajustar ancho de columnas
        foreach (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'] as $col) {
            $sheet->getColumnDimension($col)->setWidth(20);
        }
    }

    /**
     * Crear pestaña de Incidencias y Alertas
     */
    private function createIncidentsAlertsSheet(Spreadsheet $spreadsheet, Event $event): void
    {
        $sheet = $spreadsheet->createSheet();
        $sheet->setTitle('Decisiones_Alertas');

        // Encabezados para incidencias
        $headers = [
            'ID_Incidencia',
            'ID_Tarea',
            'Nombre_Tarea',
            'Descripcion_Incidencia',
            'Estado_Incidencia',
            'ID_Reportado_Por',
            'Nombre_Reportado_Por',
            'Fecha_Reporte',
            'ID_Alerta',
            'Tipo_Alerta',
            'Descripcion_Alerta',
            'Fecha_Alerta',
        ];

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $sheet->getStyle($col . '1')->getFill()
                ->setFillType(Fill::FILL_SOLID)
                ->getStartColor()->setRGB('E0E0E0');
            $col++;
        }

        // Combinar datos de incidencias y alertas
        $row = 2;
        foreach ($event->tasks as $task) {
            // Incidencias de la tarea
            foreach ($task->incidents as $incident) {
                $sheet->setCellValue('A' . $row, $incident->id);
                $sheet->setCellValue('B' . $row, $task->id);
                $sheet->setCellValue('C' . $row, $task->title);
                $sheet->setCellValue('D' . $row, $incident->description);
                $sheet->setCellValue('E' . $row, $incident->status);
                $sheet->setCellValue('F' . $row, $incident->reported_by_id);
                $sheet->setCellValue('G' . $row, $incident->reportedBy?->name ?? 'N/A');
                $sheet->setCellValue('H' . $row, $incident->created_at->format('Y-m-d H:i:s'));
                $sheet->setCellValue('I' . $row, '');
                $sheet->setCellValue('J' . $row, '');
                $sheet->setCellValue('K' . $row, '');
                $sheet->setCellValue('L' . $row, '');
                $row++;
            }

            // Alertas de la tarea
            foreach ($task->alerts as $alert) {
                $sheet->setCellValue('A' . $row, '');
                $sheet->setCellValue('B' . $row, $task->id);
                $sheet->setCellValue('C' . $row, $task->title);
                $sheet->setCellValue('D' . $row, '');
                $sheet->setCellValue('E' . $row, '');
                $sheet->setCellValue('F' . $row, '');
                $sheet->setCellValue('G' . $row, '');
                $sheet->setCellValue('H' . $row, '');
                $sheet->setCellValue('I' . $row, $alert->id);
                $sheet->setCellValue('J' . $row, $alert->type);
                $sheet->setCellValue('K' . $row, $alert->message ?? '');
                $sheet->setCellValue('L' . $row, $alert->created_at->format('Y-m-d H:i:s'));
                $row++;
            }
        }

        // Inmovilizar paneles
        $sheet->freezePane('A2');

        // Aplicar filtro automático
        $sheet->setAutoFilter('A1:L' . ($row - 1));

        // Ajustar ancho de columnas
        foreach (['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L'] as $col) {
            $sheet->getColumnDimension($col)->setWidth(18);
        }
    }
}
