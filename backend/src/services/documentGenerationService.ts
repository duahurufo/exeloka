import fs from 'fs/promises';
import path from 'path';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, Table, TableRow, TableCell } from 'docx';
import ExcelJS from 'exceljs';
import PptxGenJS from 'pptxgenjs';
import { getConnection } from '../config/database';
import { logger } from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { Recommendation, GeneratedDocument, DocumentGenerationRequest } from '../types';

interface DocumentTemplate {
  title: string;
  sections: string[];
  styling: {
    primaryColor: string;
    secondaryColor: string;
    fontFamily: string;
  };
}

class DocumentGenerationService {
  private outputPath: string;
  private templates: Map<string, DocumentTemplate> = new Map();

  constructor() {
    this.outputPath = process.env.DOCUMENTS_PATH || './generated_documents';
    this.ensureOutputDirectory();
    this.initializeTemplates();
  }

  private async ensureOutputDirectory() {
    try {
      await fs.access(this.outputPath);
    } catch {
      await fs.mkdir(this.outputPath, { recursive: true });
    }
  }

  private initializeTemplates() {
    this.templates = new Map();
    
    // Default business template
    this.templates.set('business', {
      title: 'Cultural Engagement Strategy',
      sections: [
        'executive_summary',
        'cultural_context',
        'strategic_approach',
        'detailed_methods',
        'risk_mitigation',
        'timeline',
        'success_metrics',
        'appendices'
      ],
      styling: {
        primaryColor: '2E5984',
        secondaryColor: '4A90B8',
        fontFamily: 'Arial'
      }
    });

    // Government template
    this.templates.set('government', {
      title: 'Community Engagement Plan',
      sections: [
        'executive_summary',
        'background',
        'cultural_considerations',
        'engagement_strategy',
        'implementation_plan',
        'risk_assessment',
        'monitoring_evaluation'
      ],
      styling: {
        primaryColor: '1B365D',
        secondaryColor: '2E5984',
        fontFamily: 'Calibri'
      }
    });
  }

  async generateDocx(
    recommendationId: number, 
    userId: number, 
    options: DocumentGenerationRequest = {} as DocumentGenerationRequest
  ): Promise<GeneratedDocument> {
    try {
      logger.info('Starting DOCX generation', { recommendationId, userId });

      // Get recommendation data
      const recommendation = await this.getRecommendationData(recommendationId, userId);
      const template = this.templates.get(options.template_type || 'business')!;

      // Create document
      const doc = new Document({
        sections: [{
          properties: {},
          children: await this.buildDocxContent(recommendation, template, options)
        }]
      });

      // Generate filename and save
      const filename = `recommendation_${recommendationId}_${Date.now()}.docx`;
      const filePath = path.join(this.outputPath, filename);
      
      const buffer = await Packer.toBuffer(doc);
      await fs.writeFile(filePath, buffer);

      // Store document record
      const document = await this.storeDocumentRecord(
        recommendationId,
        'docx',
        filename,
        filePath,
        buffer.length
      );

      logger.info('DOCX generated successfully', { 
        recommendationId, 
        filename, 
        fileSize: buffer.length 
      });

      return document;
    } catch (error) {
      logger.error('DOCX generation failed', { recommendationId, userId, error });
      throw createError('Failed to generate DOCX document', 500);
    }
  }

  async generateXlsx(
    recommendationId: number, 
    userId: number, 
    options: DocumentGenerationRequest = {} as DocumentGenerationRequest
  ): Promise<GeneratedDocument> {
    try {
      logger.info('Starting XLSX generation', { recommendationId, userId });

      // Get recommendation data
      const recommendation = await this.getRecommendationData(recommendationId, userId);

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Exeloka Cultural Wisdom System';
      workbook.created = new Date();

      await this.buildXlsxContent(workbook, recommendation, options);

      // Generate filename and save
      const filename = `recommendation_${recommendationId}_${Date.now()}.xlsx`;
      const filePath = path.join(this.outputPath, filename);
      
      await workbook.xlsx.writeFile(filePath);
      
      // Get file size
      const stats = await fs.stat(filePath);

      // Store document record
      const document = await this.storeDocumentRecord(
        recommendationId,
        'xlsx',
        filename,
        filePath,
        stats.size
      );

      logger.info('XLSX generated successfully', { 
        recommendationId, 
        filename, 
        fileSize: stats.size 
      });

      return document;
    } catch (error) {
      logger.error('XLSX generation failed', { recommendationId, userId, error });
      throw createError('Failed to generate XLSX document', 500);
    }
  }

  async generatePptx(
    recommendationId: number, 
    userId: number, 
    options: DocumentGenerationRequest = {} as DocumentGenerationRequest
  ): Promise<GeneratedDocument> {
    try {
      logger.info('Starting PPTX generation', { recommendationId, userId });

      // Get recommendation data
      const recommendation = await this.getRecommendationData(recommendationId, userId);

      // Create presentation
      const pres = new PptxGenJS();
      pres.author = 'Exeloka Cultural Wisdom System';
      pres.company = options.custom_branding?.company_name || 'Exeloka';
      pres.subject = 'Cultural Engagement Strategy';
      pres.title = recommendation.title;

      await this.buildPptxContent(pres, recommendation, options);

      // Generate filename and save
      const filename = `recommendation_${recommendationId}_${Date.now()}.pptx`;
      const filePath = path.join(this.outputPath, filename);
      
      await pres.writeFile({ fileName: filePath });
      
      // Get file size
      const stats = await fs.stat(filePath);

      // Store document record
      const document = await this.storeDocumentRecord(
        recommendationId,
        'pptx',
        filename,
        filePath,
        stats.size
      );

      logger.info('PPTX generated successfully', { 
        recommendationId, 
        filename, 
        fileSize: stats.size 
      });

      return document;
    } catch (error) {
      logger.error('PPTX generation failed', { recommendationId, userId, error });
      throw createError('Failed to generate PPTX document', 500);
    }
  }

  private async getRecommendationData(recommendationId: number, userId: number): Promise<any> {
    const connection = getConnection();
    
    const [recommendations] = await connection.execute(`
      SELECT r.*, p.title as project_title, p.description as project_description,
             p.location_details, p.stakeholders, p.project_type,
             u.company_name, u.full_name
      FROM recommendations r
      JOIN projects p ON r.project_id = p.id
      JOIN users u ON p.user_id = u.id
      WHERE r.id = ? AND p.user_id = ?
    `, [recommendationId, userId]) as any[];

    if (!recommendations.length) {
      throw createError('Recommendation not found or access denied', 404);
    }

    return recommendations[0];
  }

  private async buildDocxContent(
    recommendation: any, 
    template: DocumentTemplate, 
    options: DocumentGenerationRequest
  ): Promise<Paragraph[]> {
    const content: Paragraph[] = [];

    // Title page
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: recommendation.title,
            bold: true,
            size: 32,
            color: template.styling.primaryColor
          })
        ],
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({ text: '' }), // Empty line
      new Paragraph({
        children: [
          new TextRun({
            text: `Prepared for: ${recommendation.company_name}`,
            italics: true,
            size: 24
          })
        ],
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({
        children: [
          new TextRun({
            text: `Date: ${new Date().toLocaleDateString()}`,
            size: 20
          })
        ],
        alignment: AlignmentType.CENTER
      }),
      new Paragraph({ text: '' }), // Page break simulation
      new Paragraph({ text: '' })
    );

    // Executive Summary
    if (recommendation.executive_summary) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Executive Summary',
              bold: true,
              size: 28,
              color: template.styling.primaryColor
            })
          ],
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          children: [new TextRun({ text: recommendation.executive_summary })]
        }),
        new Paragraph({ text: '' })
      );
    }

    // Project Overview
    content.push(
      new Paragraph({
        children: [
          new TextRun({
            text: 'Project Overview',
            bold: true,
            size: 28,
            color: template.styling.primaryColor
          })
        ],
        heading: HeadingLevel.HEADING_1
      }),
      new Paragraph({
        children: [
          new TextRun({ text: 'Project: ', bold: true }),
          new TextRun({ text: recommendation.project_title })
        ]
      }),
      new Paragraph({
        children: [new TextRun({ text: recommendation.project_description })]
      }),
      new Paragraph({ text: '' })
    );

    // Strategic Approach
    if (recommendation.strategic_approach) {
      const strategies = JSON.parse(recommendation.strategic_approach);
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Strategic Approach',
              bold: true,
              size: 28,
              color: template.styling.primaryColor
            })
          ],
          heading: HeadingLevel.HEADING_1
        })
      );

      strategies.forEach((strategy: string, index: number) => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun({ text: strategy })
            ]
          })
        );
      });
      content.push(new Paragraph({ text: '' }));
    }

    // Cultural Considerations
    if (recommendation.cultural_considerations) {
      const considerations = JSON.parse(recommendation.cultural_considerations);
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Cultural Considerations',
              bold: true,
              size: 28,
              color: template.styling.primaryColor
            })
          ],
          heading: HeadingLevel.HEADING_1
        })
      );

      considerations.forEach((consideration: string) => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', bold: true }),
              new TextRun({ text: consideration })
            ]
          })
        );
      });
      content.push(new Paragraph({ text: '' }));
    }

    // Risk Mitigation
    if (recommendation.risk_mitigation) {
      const risks = JSON.parse(recommendation.risk_mitigation);
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Risk Mitigation Strategies',
              bold: true,
              size: 28,
              color: template.styling.primaryColor
            })
          ],
          heading: HeadingLevel.HEADING_1
        })
      );

      risks.forEach((risk: string) => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', bold: true }),
              new TextRun({ text: risk })
            ]
          })
        );
      });
      content.push(new Paragraph({ text: '' }));
    }

    // Success Metrics
    if (recommendation.success_metrics) {
      const metrics = JSON.parse(recommendation.success_metrics);
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Success Metrics',
              bold: true,
              size: 28,
              color: template.styling.primaryColor
            })
          ],
          heading: HeadingLevel.HEADING_1
        })
      );

      metrics.forEach((metric: string) => {
        content.push(
          new Paragraph({
            children: [
              new TextRun({ text: '• ', bold: true }),
              new TextRun({ text: metric })
            ]
          })
        );
      });
      content.push(new Paragraph({ text: '' }));
    }

    // Timeline
    if (recommendation.timeline_recommendations) {
      content.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'Implementation Timeline',
              bold: true,
              size: 28,
              color: template.styling.primaryColor
            })
          ],
          heading: HeadingLevel.HEADING_1
        }),
        new Paragraph({
          children: [new TextRun({ text: recommendation.timeline_recommendations })]
        }),
        new Paragraph({ text: '' })
      );
    }

    // Footer
    content.push(
      new Paragraph({ text: '' }),
      new Paragraph({
        children: [
          new TextRun({
            text: 'Generated by Exeloka Cultural Wisdom System',
            italics: true,
            size: 16,
            color: '888888'
          })
        ],
        alignment: AlignmentType.CENTER
      })
    );

    return content;
  }

  private async buildXlsxContent(
    workbook: ExcelJS.Workbook, 
    recommendation: any, 
    options: DocumentGenerationRequest
  ): Promise<void> {
    // Summary worksheet
    const summarySheet = workbook.addWorksheet('Executive Summary');
    summarySheet.getCell('A1').value = 'Cultural Engagement Strategy Report';
    summarySheet.getCell('A1').font = { bold: true, size: 16 };
    summarySheet.getCell('A3').value = 'Project:';
    summarySheet.getCell('B3').value = recommendation.project_title;
    summarySheet.getCell('A4').value = 'Company:';
    summarySheet.getCell('B4').value = recommendation.company_name;
    summarySheet.getCell('A5').value = 'Date:';
    summarySheet.getCell('B5').value = new Date().toLocaleDateString();
    summarySheet.getCell('A6').value = 'Confidence Score:';
    summarySheet.getCell('B6').value = `${(recommendation.confidence_score * 100).toFixed(1)}%`;

    if (recommendation.executive_summary) {
      summarySheet.getCell('A8').value = 'Executive Summary:';
      summarySheet.getCell('A8').font = { bold: true };
      summarySheet.getCell('A9').value = recommendation.executive_summary;
      summarySheet.getCell('A9').alignment = { wrapText: true };
    }

    // Strategic Approach worksheet
    if (recommendation.strategic_approach) {
      const strategiesSheet = workbook.addWorksheet('Strategic Approach');
      const strategies = JSON.parse(recommendation.strategic_approach);
      
      strategiesSheet.getCell('A1').value = 'Strategic Approach';
      strategiesSheet.getCell('A1').font = { bold: true, size: 14 };
      
      strategies.forEach((strategy: string, index: number) => {
        strategiesSheet.getCell(`A${index + 3}`).value = `${index + 1}.`;
        strategiesSheet.getCell(`B${index + 3}`).value = strategy;
        strategiesSheet.getCell(`B${index + 3}`).alignment = { wrapText: true };
      });
    }

    // Cultural Considerations worksheet
    if (recommendation.cultural_considerations) {
      const culturalSheet = workbook.addWorksheet('Cultural Considerations');
      const considerations = JSON.parse(recommendation.cultural_considerations);
      
      culturalSheet.getCell('A1').value = 'Cultural Considerations';
      culturalSheet.getCell('A1').font = { bold: true, size: 14 };
      
      considerations.forEach((consideration: string, index: number) => {
        culturalSheet.getCell(`A${index + 3}`).value = consideration;
        culturalSheet.getCell(`A${index + 3}`).alignment = { wrapText: true };
      });
    }

    // Risk Assessment worksheet
    if (recommendation.risk_mitigation) {
      const riskSheet = workbook.addWorksheet('Risk Assessment');
      const risks = JSON.parse(recommendation.risk_mitigation);
      
      riskSheet.getCell('A1').value = 'Risk Mitigation Strategies';
      riskSheet.getCell('A1').font = { bold: true, size: 14 };
      riskSheet.getCell('A2').value = 'Risk/Mitigation Strategy';
      riskSheet.getCell('A2').font = { bold: true };
      
      risks.forEach((risk: string, index: number) => {
        riskSheet.getCell(`A${index + 3}`).value = risk;
        riskSheet.getCell(`A${index + 3}`).alignment = { wrapText: true };
      });
    }

    // Format all sheets
    workbook.eachSheet((worksheet) => {
      worksheet.columns.forEach((column) => {
        column.width = 15;
      });
      worksheet.getColumn('B').width = 50; // Wider for descriptions
    });
  }

  private async buildPptxContent(
    pres: PptxGenJS, 
    recommendation: any, 
    options: DocumentGenerationRequest
  ): Promise<void> {
    const primaryColor = options.custom_branding?.colors?.primary || '2E5984';

    // Title slide
    const titleSlide = pres.addSlide();
    titleSlide.addText(recommendation.title, {
      x: 0.5, y: 2, w: 9, h: 2,
      fontSize: 32, bold: true, color: primaryColor, align: 'center'
    });
    titleSlide.addText(`Prepared for: ${recommendation.company_name}`, {
      x: 0.5, y: 4, w: 9, h: 0.5,
      fontSize: 18, align: 'center', color: '666666'
    });
    titleSlide.addText(`Date: ${new Date().toLocaleDateString()}`, {
      x: 0.5, y: 4.5, w: 9, h: 0.5,
      fontSize: 16, align: 'center', color: '666666'
    });

    // Executive Summary slide
    if (recommendation.executive_summary) {
      const summarySlide = pres.addSlide();
      summarySlide.addText('Executive Summary', {
        x: 0.5, y: 0.5, w: 9, h: 1,
        fontSize: 28, bold: true, color: primaryColor
      });
      summarySlide.addText(recommendation.executive_summary, {
        x: 0.5, y: 1.5, w: 9, h: 5,
        fontSize: 16, wrap: true
      });
    }

    // Strategic Approach slides
    if (recommendation.strategic_approach) {
      const strategies = JSON.parse(recommendation.strategic_approach);
      const strategySlide = pres.addSlide();
      
      strategySlide.addText('Strategic Approach', {
        x: 0.5, y: 0.5, w: 9, h: 1,
        fontSize: 28, bold: true, color: primaryColor
      });

      const bulletPoints = strategies.slice(0, 5).map((strategy: string, index: number) => {
        return { text: strategy, options: { bullet: true } };
      });

      strategySlide.addText(bulletPoints, {
        x: 0.5, y: 1.5, w: 9, h: 5,
        fontSize: 16
      });
    }

    // Cultural Considerations slide
    if (recommendation.cultural_considerations) {
      const considerations = JSON.parse(recommendation.cultural_considerations);
      const culturalSlide = pres.addSlide();
      
      culturalSlide.addText('Cultural Considerations', {
        x: 0.5, y: 0.5, w: 9, h: 1,
        fontSize: 28, bold: true, color: primaryColor
      });

      const bulletPoints = considerations.slice(0, 5).map((consideration: string) => {
        return { text: consideration, options: { bullet: true } };
      });

      culturalSlide.addText(bulletPoints, {
        x: 0.5, y: 1.5, w: 9, h: 5,
        fontSize: 16
      });
    }

    // Timeline slide
    if (recommendation.timeline_recommendations) {
      const timelineSlide = pres.addSlide();
      timelineSlide.addText('Implementation Timeline', {
        x: 0.5, y: 0.5, w: 9, h: 1,
        fontSize: 28, bold: true, color: primaryColor
      });
      timelineSlide.addText(recommendation.timeline_recommendations, {
        x: 0.5, y: 1.5, w: 9, h: 5,
        fontSize: 16, wrap: true
      });
    }

    // Final slide with confidence score
    const finalSlide = pres.addSlide();
    finalSlide.addText('Recommendation Confidence', {
      x: 0.5, y: 2, w: 9, h: 1,
      fontSize: 28, bold: true, color: primaryColor, align: 'center'
    });
    finalSlide.addText(`${(recommendation.confidence_score * 100).toFixed(1)}%`, {
      x: 0.5, y: 3, w: 9, h: 2,
      fontSize: 48, bold: true, color: primaryColor, align: 'center'
    });
    finalSlide.addText('Generated by Exeloka Cultural Wisdom System', {
      x: 0.5, y: 6, w: 9, h: 0.5,
      fontSize: 14, align: 'center', color: '888888'
    });
  }

  private async storeDocumentRecord(
    recommendationId: number,
    documentType: 'docx' | 'xlsx' | 'pptx',
    filename: string,
    filePath: string,
    fileSize: number
  ): Promise<GeneratedDocument> {
    const connection = getConnection();
    
    const [result] = await connection.execute(`
      INSERT INTO generated_documents 
      (recommendation_id, document_type, filename, file_path, file_size)
      VALUES (?, ?, ?, ?, ?)
    `, [recommendationId, documentType, filename, filePath, fileSize]) as any[];

    const documentId = result.insertId;

    // Fetch the complete document record
    const [documents] = await connection.execute(
      'SELECT * FROM generated_documents WHERE id = ?',
      [documentId]
    ) as any[];

    return documents[0];
  }

  async getDocumentDownloadInfo(filename: string, userId: number): Promise<{filePath: string, mimeType: string}> {
    const connection = getConnection();
    
    const [documents] = await connection.execute(`
      SELECT gd.*, p.user_id
      FROM generated_documents gd
      JOIN recommendations r ON gd.recommendation_id = r.id
      JOIN projects p ON r.project_id = p.id
      WHERE gd.filename = ? AND p.user_id = ?
    `, [filename, userId]) as any[];

    if (!documents.length) {
      throw createError('Document not found or access denied', 404);
    }

    const document = documents[0];
    
    // Update download count
    await connection.execute(
      'UPDATE generated_documents SET download_count = download_count + 1 WHERE id = ?',
      [document.id]
    );

    const mimeTypes = {
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    };

    return {
      filePath: document.file_path,
      mimeType: mimeTypes[document.document_type as keyof typeof mimeTypes]
    };
  }
}

export const documentGenerationService = new DocumentGenerationService();