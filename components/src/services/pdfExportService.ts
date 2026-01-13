// ============================================================
// SERVICIO DE EXPORTACIÓN A PDF
// ============================================================

import jsPDF from 'jspdf';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import type { RoadmapAnalysis } from '../../../types/roadmapTypes';

/**
 * Exporta el análisis de roadmap a PDF y retorna el blob
 */
export async function exportRoadmapToPDF(
    analysis: RoadmapAnalysis,
    pageTitle: string
): Promise<Blob> {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    let yPosition = 15;

    // Configuración de colores
    const primaryColor: [number, number, number] = [124, 58, 237];
    const secondaryColor: [number, number, number] = [71, 85, 105];
    const lightGray: [number, number, number] = [241, 245, 249];

    // ===== PORTADA COMPACTA =====
    pdf.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.rect(0, 0, pageWidth, 45, 'F');

    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SIDON ESTRATEGA', pageWidth / 2, 18, { align: 'center' });

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'normal');
    pdf.text(pageTitle, pageWidth / 2, 28, { align: 'center' });

    pdf.setFontSize(9);
    pdf.text(
        `Generado: ${format(new Date(analysis.generatedAt), "d 'de' MMMM, yyyy HH:mm", { locale: es })}`,
        pageWidth / 2,
        36,
        { align: 'center' }
    );

    yPosition = 52;

    // ===== ROADMAP DE FECHAS (PRIORIDAD) =====
    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text('>> ROADMAP DE FECHAS', 15, yPosition);
    yPosition += 6;

    if (analysis.milestones.length > 0) {
        analysis.milestones.forEach((milestone) => {
            if (yPosition > pageHeight - 15) {
                pdf.addPage();
                yPosition = 15;
            }

            const statusColors: Record<string, [number, number, number]> = {
                completed: [16, 185, 129],
                'in-progress': [59, 130, 246],
                pending: [148, 163, 184],
                overdue: [239, 68, 68],
            };
            const color = statusColors[milestone.status];
            pdf.setFillColor(color[0], color[1], color[2]);
            pdf.circle(17, yPosition - 1, 1.5, 'F');

            pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            pdf.setFontSize(10);
            pdf.setFont('helvetica', 'bold');
            pdf.text(milestone.title, 22, yPosition);

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            pdf.text(format(new Date(milestone.date), "d 'de' MMMM, yyyy", { locale: es }), 22, yPosition + 4);

            yPosition += 9;

            milestone.items.slice(0, 5).forEach((item) => {
                if (yPosition > pageHeight - 15) {
                    pdf.addPage();
                    yPosition = 15;
                }
                pdf.setFontSize(7.5);
                pdf.setTextColor(80, 80, 80);
                pdf.text(`• ${item}`, 24, yPosition);
                yPosition += 3.5;
            });

            if (milestone.items.length > 5) {
                pdf.setFontSize(7);
                pdf.setTextColor(100, 100, 100);
                pdf.setFont('helvetica', 'italic');
                pdf.text(`... y ${milestone.items.length - 5} mas`, 24, yPosition);
                yPosition += 4;
            }

            yPosition += 4;
        });
    } else {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text('No hay milestones definidos', 15, yPosition);
        yPosition += 8;
    }

    yPosition += 3;

    // ===== ESTADÍSTICAS COMPACTAS =====
    if (yPosition > pageHeight - 25) {
        pdf.addPage();
        yPosition = 15;
    }

    pdf.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    pdf.roundedRect(15, yPosition, pageWidth - 30, 20, 2, 2, 'F');

    pdf.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'bold');

    const stats = [
        { label: 'Total', value: analysis.timeline.totalItems },
        { label: 'Con Fechas', value: analysis.timeline.itemsWithDates },
        { label: 'Vencidas', value: analysis.timeline.overdueTasks },
        { label: 'Proximas', value: analysis.timeline.upcomingTasks },
    ];

    const statWidth = (pageWidth - 40) / 4;
    stats.forEach((stat, index) => {
        const x = 20 + index * statWidth;
        pdf.text(stat.label, x, yPosition + 7);
        pdf.setFontSize(14);
        pdf.text(stat.value.toString(), x, yPosition + 15);
        pdf.setFontSize(8);
    });

    yPosition += 25;

    // ===== RESUMEN EJECUTIVO COMPACTO =====
    if (yPosition > pageHeight - 30) {
        pdf.addPage();
        yPosition = 15;
    }

    pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RESUMEN EJECUTIVO', 15, yPosition);
    yPosition += 5;

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    const summaryLines = pdf.splitTextToSize(analysis.summary, pageWidth - 30);
    pdf.text(summaryLines, 15, yPosition);
    yPosition += summaryLines.length * 3.5 + 5;

    // ===== PUNTOS CRÍTICOS =====
    if (analysis.criticalPoints.length > 0) {
        if (yPosition > pageHeight - 25) {
            pdf.addPage();
            yPosition = 15;
        }

        pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('!! PUNTOS CRITICOS', 15, yPosition);
        yPosition += 6;

        analysis.criticalPoints.forEach((point) => {
            if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 15;
            }

            const severityColors: Record<string, [number, number, number]> = {
                high: [239, 68, 68],
                medium: [234, 179, 8],
                low: [59, 130, 246],
            };
            const sevColor = severityColors[point.severity];
            pdf.setFillColor(sevColor[0], sevColor[1], sevColor[2]);
            pdf.roundedRect(15, yPosition - 2, 2, 2, 0.5, 0.5, 'F');

            pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text(point.item, 20, yPosition);

            yPosition += 4;
            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'normal');
            const reasonLines = pdf.splitTextToSize(point.reason, pageWidth - 30);
            pdf.text(reasonLines, 20, yPosition);
            yPosition += reasonLines.length * 3 + 5;
        });

        yPosition += 2;
    }

    // ===== INSIGHTS =====
    if (analysis.insights.length > 0) {
        if (yPosition > pageHeight - 25) {
            pdf.addPage();
            yPosition = 15;
        }

        pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('** INSIGHTS Y RECOMENDACIONES', 15, yPosition);
        yPosition += 6;

        analysis.insights.forEach((insight) => {
            if (yPosition > pageHeight - 15) {
                pdf.addPage();
                yPosition = 15;
            }

            const insightPrefixes: Record<string, string> = {
                risk: '[!] RIESGO',
                opportunity: '[+] OPORTUNIDAD',
                suggestion: '[*] SUGERENCIA',
                warning: '[!] ADVERTENCIA',
            };

            pdf.setFontSize(8);
            pdf.setFont('helvetica', 'bold');
            pdf.text(insightPrefixes[insight.type], 15, yPosition);

            yPosition += 4;
            pdf.setFont('helvetica', 'normal');
            pdf.setFontSize(8);
            const messageLines = pdf.splitTextToSize(insight.message, pageWidth - 30);
            pdf.text(messageLines, 15, yPosition);
            yPosition += messageLines.length * 3 + 4;
        });
    }

    // ===== RESPONSABILIDADES =====
    if (analysis.responsibilities.length > 0) {
        pdf.addPage();
        yPosition = 15;

        pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        pdf.text('@ RESPONSABILIDADES', 15, yPosition);
        yPosition += 6;

        analysis.responsibilities.forEach((resp) => {
            if (yPosition > pageHeight - 20) {
                pdf.addPage();
                yPosition = 15;
            }

            pdf.setFontSize(9);
            pdf.setFont('helvetica', 'bold');
            pdf.text(`${resp.person}`, 15, yPosition);

            pdf.setFontSize(7);
            pdf.setFont('helvetica', 'normal');
            pdf.text(`Carga: ${resp.workload.toUpperCase()} | Criticas: ${resp.criticalTasks}`, 15, yPosition + 3);

            yPosition += 8;
            resp.tasks.slice(0, 10).forEach((task) => {
                if (yPosition > pageHeight - 15) {
                    pdf.addPage();
                    yPosition = 15;
                }

                // Defensive check: Handle both object and string formats
                const isObject = typeof task === 'object' && task !== null;
                const taskTitle = isObject ? (task as any).title : task;
                const taskIsCritical = isObject ? (task as any).isCritical : false;
                const taskDateStr = isObject ? (task as any).date : null;
                const taskStatusText = isObject ? (task as any).status : null;

                pdf.setFontSize(7.5);
                pdf.setFont('helvetica', taskIsCritical ? 'bold' : 'normal');

                if (taskIsCritical) {
                    pdf.setTextColor(220, 38, 38); // Stronger Red
                } else {
                    pdf.setTextColor(60, 60, 60); // Dark grey for tasks
                }

                const dateDisplay = taskDateStr ? ` [${format(parseISO(taskDateStr), "d/MM", { locale: es })}]` : '';
                const statusDisplay = taskStatusText ? ` (${taskStatusText})` : '';

                pdf.text(`• ${taskTitle}${dateDisplay}${statusDisplay}`, 18, yPosition);
                yPosition += 4;
            });

            pdf.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);

            if (resp.tasks.length > 10) {
                pdf.setFontSize(7);
                pdf.setTextColor(100, 100, 100);
                pdf.setFont('helvetica', 'italic');
                pdf.text(`... y ${resp.tasks.length - 10} mas`, 18, yPosition);
                yPosition += 5;
            }

            yPosition += 4;
        });
    }

    // ===== FOOTER EN TODAS LAS PÁGINAS =====
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
        pdf.setPage(i);
        pdf.setFontSize(7);
        pdf.setTextColor(150, 150, 150);
        pdf.text(
            `Pag. ${i}/${totalPages} | SIDON ESTRATEGA | Powered by OpenAI GPT-4`,
            pageWidth / 2,
            pageHeight - 8,
            { align: 'center' }
        );
    }

    // Retornar blob para poder enviarlo por email
    return pdf.output('blob');
}

/**
 * Descarga el PDF localmente
 */
export async function downloadRoadmapPDF(
    analysis: RoadmapAnalysis,
    pageTitle: string
): Promise<void> {
    const blob = await exportRoadmapToPDF(analysis, pageTitle);
    const fileName = `SIDON_Roadmap_${pageTitle.replace(/\s+/g, '_')}_${format(new Date(), 'yyyyMMdd')}.pdf`;

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
}
