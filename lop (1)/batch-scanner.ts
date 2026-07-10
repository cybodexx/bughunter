import { storage } from './storage';
import { scanner } from './scanner';
import { type BatchScan, type Scan, type InsertScan } from '@shared/schema';

export class BatchScanner {
  private activeBatches: Set<string> = new Set();

  async startBatchScan(batchId: string): Promise<void> {
    if (this.activeBatches.has(batchId)) {
      throw new Error('Batch scan already running');
    }

    const batch = await storage.getBatchScan(batchId);
    if (!batch) throw new Error('Batch scan not found');

    this.activeBatches.add(batchId);

    await storage.updateBatchScan(batchId, {
      status: 'running',
      startedAt: new Date()
    });

    try {
      const scanPromises: Promise<void>[] = [];

      // Create individual scans for each target URL
      for (const targetUrl of batch.targetUrls) {
        const scanPromise = this.processIndividualScan(
          batchId, 
          targetUrl, 
          batch.enabledModules
        );
        scanPromises.push(scanPromise);
      }

      // Wait for all scans to complete
      await Promise.allSettled(scanPromises);

      await storage.updateBatchScan(batchId, {
        status: 'completed',
        completedAt: new Date(),
        completedScans: batch.totalScans
      });

    } catch (error) {
      console.error('Batch scan failed:', error);
      await storage.updateBatchScan(batchId, {
        status: 'failed',
        completedAt: new Date()
      });
    } finally {
      this.activeBatches.delete(batchId);
    }
  }

  private async processIndividualScan(
    batchId: string,
    targetUrl: string,
    enabledModules: string[]
  ): Promise<void> {
    try {
      // Create individual scan
      const scanData: InsertScan = {
        targetUrl,
        authType: 'none',
        intensity: 'high', // Use high intensity for comprehensive testing
        enabledModules
      };

      const scan = await storage.createScan(scanData);
      
      // Start the scan
      await scanner.startScan(scan.id);

      // Update batch progress
      const batch = await storage.getBatchScan(batchId);
      if (batch) {
        await storage.updateBatchScan(batchId, {
          completedScans: batch.completedScans + 1
        });
      }

    } catch (error) {
      console.error(`Failed to scan ${targetUrl}:`, error);
    }
  }

  // Automated assignment evaluation for students
  async evaluateStudentAssignment(studentId: string, assignmentId: string): Promise<void> {
    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment || !assignment.isActive) {
      throw new Error('Assignment not found or inactive');
    }

    const student = await storage.getStudent(studentId);
    if (!student) {
      throw new Error('Student not found');
    }

    // Create batch scan for all target URLs in the assignment
    const batchScanData = {
      title: `Assignment: ${assignment.title} - Student: ${student.name}`,
      targetUrls: assignment.targetUrls,
      enabledModules: assignment.enabledModules
    };

    const batchScan = await storage.createBatchScan(batchScanData);
    
    // Start the batch scan
    await this.startBatchScan(batchScan.id);

    // Wait for completion and calculate scores
    await this.waitForBatchCompletion(batchScan.id);
    await this.calculateStudentScores(studentId, assignmentId, batchScan.id);
  }

  private async waitForBatchCompletion(batchId: string): Promise<void> {
    return new Promise((resolve) => {
      const checkStatus = async () => {
        const batch = await storage.getBatchScan(batchId);
        if (batch && (batch.status === 'completed' || batch.status === 'failed')) {
          resolve();
        } else {
          setTimeout(checkStatus, 5000); // Check every 5 seconds
        }
      };
      checkStatus();
    });
  }

  private async calculateStudentScores(
    studentId: string,
    assignmentId: string,
    batchId: string
  ): Promise<void> {
    const batch = await storage.getBatchScan(batchId);
    if (!batch) return;

    // Get all scans from this batch and calculate average score
    const allScans = await storage.getAllScans();
    const batchScans = allScans.filter(scan => 
      batch.targetUrls.includes(scan.targetUrl) && 
      scan.status === 'completed'
    );

    let totalScore = 0;
    for (const scan of batchScans) {
      const score = await storage.calculateSecurityScore(scan.id);
      totalScore += score;
      
      // Create individual student scan record
      await storage.createStudentScan({
        studentId,
        assignmentId,
        scanId: scan.id,
        securityScore: score
      });
    }

    const averageScore = batchScans.length > 0 ? Math.round(totalScore / batchScans.length) : 0;
    
    console.log(`Student ${studentId} - Assignment ${assignmentId} - Average Score: ${averageScore}`);
  }

  // Batch evaluation for entire class
  async evaluateEntireClass(assignmentId: string): Promise<void> {
    const assignment = await storage.getAssignment(assignmentId);
    if (!assignment || !assignment.isActive) {
      throw new Error('Assignment not found or inactive');
    }

    const students = await storage.getAllStudents();
    const evaluationPromises: Promise<void>[] = [];

    for (const student of students) {
      const evaluationPromise = this.evaluateStudentAssignment(student.id, assignmentId);
      evaluationPromises.push(evaluationPromise);
    }

    // Process all students in parallel for efficiency
    await Promise.allSettled(evaluationPromises);
    
    console.log(`Completed evaluation for assignment: ${assignment.title}`);
    console.log(`Evaluated ${students.length} students`);
  }
}

export const batchScanner = new BatchScanner();