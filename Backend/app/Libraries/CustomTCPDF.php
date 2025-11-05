<?php

declare(strict_types=1);

namespace App\Libraries;

use TCPDF;

/**
 * Clase personalizada de TCPDF para incluir footer con fecha y número de página
 */
class CustomTCPDF extends TCPDF
{
    /**
     * Método para generar el pie de página
     */
    public function Footer(): void
    {
        // Posición a 1.5 cm del fondo
        $this->SetY(-15);

        // Configurar fuente (9pt según normativas)
        $this->SetFont('helvetica', '', 9);

        // Fecha y hora de generación (izquierda)
        $generatedAt = date('d/m/Y H:i A');
        $this->Cell(0, 10, 'Generado el: ' . $generatedAt, 0, 0, 'L');

        // Número de página (derecha)
        $this->Cell(0, 10, 'Página ' . $this->getAliasNumPage() . ' de ' . $this->getAliasNbPages(), 0, 0, 'R');
    }
}
