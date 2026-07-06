import type { Express } from "express";
import { createServer, type Server } from "http";
import axios from "axios";
import { storage } from "./storage";
import { scanner } from "./scanner";
import { batchScanner } from "./batch-scanner";
import { 
  insertScanSchema, 
  insertStudentSchema, 
  insertAssignmentSchema, 
  insertBatchScanSchema 
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all scans
  app.get("/api/scans", async (req, res) => {
    try {
      const scans = await storage.getAllScans();
      res.json(scans);
    } catch (error) {
      console.error('Error fetching scans:', error);
      res.status(500).json({ message: "Failed to fetch scans" });
    }
  });

  // Get specific scan
  app.get("/api/scans/:id", async (req, res) => {
    try {
      const scan = await storage.getScan(req.params.id);
      if (!scan) {
        return res.status(404).json({ message: "Scan not found" });
      }
      res.json(scan);
    } catch (error) {
      console.error('Error fetching scan:', error);
      res.status(500).json({ message: "Failed to fetch scan" });
    }
  });

  // Create new scan
  app.post("/api/scans", async (req, res) => {
    try {
      const validatedData = insertScanSchema.parse(req.body);
      
      // Validate URL format
      try {
        new URL(validatedData.targetUrl);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      const scan = await storage.createScan(validatedData);
      
      // Start the scan asynchronously
      scanner.startScan(scan.id).catch((error: any) => {
        console.error('Scan failed:', error);
      });
      
      res.status(201).json(scan);
    } catch (error) {
      console.error('Error creating scan:', error);
      res.status(400).json({ message: "Failed to create scan" });
    }
  });

  // Get vulnerabilities for a scan
  app.get("/api/scans/:id/vulnerabilities", async (req, res) => {
    try {
      const vulnerabilities = await storage.getVulnerabilitiesByScanId(req.params.id);
      res.json(vulnerabilities);
    } catch (error) {
      console.error('Error fetching vulnerabilities:', error);
      res.status(500).json({ message: "Failed to fetch vulnerabilities" });
    }
  });

  // Get all vulnerabilities
  app.get("/api/vulnerabilities", async (req, res) => {
    try {
      const vulnerabilities = await storage.getAllVulnerabilities();
      res.json(vulnerabilities);
    } catch (error) {
      console.error('Error fetching vulnerabilities:', error);
      res.status(500).json({ message: "Failed to fetch vulnerabilities" });
    }
  });

  // Validate URL endpoint
  app.post("/api/validate-url", async (req, res) => {
    try {
      const { url } = req.body;
      
      if (!url) {
        return res.status(400).json({ message: "URL is required" });
      }

      // Validate URL format
      try {
        new URL(url);
      } catch {
        return res.status(400).json({ message: "Invalid URL format" });
      }

      // Try to reach the URL
      const response = await axios.get(url, {
        timeout: 10000,
        validateStatus: () => true,
        maxRedirects: 5
      });

      res.json({
        valid: true,
        status: response.status,
        accessible: response.status < 400,
        message: response.status < 400 ? "URL is accessible" : `URL returned status ${response.status}`
      });
    } catch (error) {
      console.error('URL validation error:', error);
      res.json({
        valid: false,
        accessible: false,
        message: "URL is not accessible"
      });
    }
  });

  // ============== STUDENT MANAGEMENT ROUTES ==============
  
  // Get all students
  app.get("/api/students", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  // Create new student
  app.post("/api/students", async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(400).json({ message: "Failed to create student" });
    }
  });

  // Get specific student
  app.get("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  // Update student
  app.patch("/api/students/:id", async (req, res) => {
    try {
      const student = await storage.updateStudent(req.params.id, req.body);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  // Get student scan history
  app.get("/api/students/:id/scans", async (req, res) => {
    try {
      const scans = await storage.getStudentScansByStudent(req.params.id);
      res.json(scans);
    } catch (error) {
      console.error('Error fetching student scans:', error);
      res.status(500).json({ message: "Failed to fetch student scans" });
    }
  });

  // ============== ASSIGNMENT MANAGEMENT ROUTES ==============
  
  // Get all assignments
  app.get("/api/assignments", async (req, res) => {
    try {
      const assignments = await storage.getAllAssignments();
      res.json(assignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      res.status(500).json({ message: "Failed to fetch assignments" });
    }
  });

  // Create new assignment
  app.post("/api/assignments", async (req, res) => {
    try {
      const validatedData = insertAssignmentSchema.parse(req.body);
      const assignment = await storage.createAssignment(validatedData);
      res.status(201).json(assignment);
    } catch (error) {
      console.error('Error creating assignment:', error);
      res.status(400).json({ message: "Failed to create assignment" });
    }
  });

  // Get specific assignment
  app.get("/api/assignments/:id", async (req, res) => {
    try {
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error('Error fetching assignment:', error);
      res.status(500).json({ message: "Failed to fetch assignment" });
    }
  });

  // Update assignment
  app.patch("/api/assignments/:id", async (req, res) => {
    try {
      const assignment = await storage.updateAssignment(req.params.id, req.body);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      res.json(assignment);
    } catch (error) {
      console.error('Error updating assignment:', error);
      res.status(500).json({ message: "Failed to update assignment" });
    }
  });

  // Get assignment results
  app.get("/api/assignments/:id/results", async (req, res) => {
    try {
      const studentScans = await storage.getStudentScansByAssignment(req.params.id);
      res.json(studentScans);
    } catch (error) {
      console.error('Error fetching assignment results:', error);
      res.status(500).json({ message: "Failed to fetch assignment results" });
    }
  });

  // Evaluate single student for assignment
  app.post("/api/assignments/:assignmentId/evaluate/:studentId", async (req, res) => {
    try {
      await batchScanner.evaluateStudentAssignment(req.params.studentId, req.params.assignmentId);
      res.json({ message: "Student evaluation started successfully" });
    } catch (error) {
      console.error('Error starting student evaluation:', error);
      res.status(500).json({ message: "Failed to start student evaluation" });
    }
  });

  // Evaluate entire class for assignment
  app.post("/api/assignments/:id/evaluate-all", async (req, res) => {
    try {
      await batchScanner.evaluateEntireClass(req.params.id);
      res.json({ message: "Class evaluation started successfully" });
    } catch (error) {
      console.error('Error starting class evaluation:', error);
      res.status(500).json({ message: "Failed to start class evaluation" });
    }
  });

  // ============== BATCH SCAN ROUTES ==============
  
  // Get all batch scans
  app.get("/api/batch-scans", async (req, res) => {
    try {
      const batchScans = await storage.getAllBatchScans();
      res.json(batchScans);
    } catch (error) {
      console.error('Error fetching batch scans:', error);
      res.status(500).json({ message: "Failed to fetch batch scans" });
    }
  });

  // Create new batch scan
  app.post("/api/batch-scans", async (req, res) => {
    try {
      const validatedData = insertBatchScanSchema.parse(req.body);
      const batchScan = await storage.createBatchScan(validatedData);
      
      // Start batch scan asynchronously
      batchScanner.startBatchScan(batchScan.id).catch((error: any) => {
        console.error('Batch scan failed:', error);
      });
      
      res.status(201).json(batchScan);
    } catch (error) {
      console.error('Error creating batch scan:', error);
      res.status(400).json({ message: "Failed to create batch scan" });
    }
  });

  // Get specific batch scan
  app.get("/api/batch-scans/:id", async (req, res) => {
    try {
      const batchScan = await storage.getBatchScan(req.params.id);
      if (!batchScan) {
        return res.status(404).json({ message: "Batch scan not found" });
      }
      res.json(batchScan);
    } catch (error) {
      console.error('Error fetching batch scan:', error);
      res.status(500).json({ message: "Failed to fetch batch scan" });
    }
  });

  // ============== COMPREHENSIVE REPORTING ROUTES ==============
  
  // Get vulnerability statistics
  app.get("/api/reports/vulnerability-stats", async (req, res) => {
    try {
      const vulnerabilities = await storage.getAllVulnerabilities();
      const stats = {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
        byType: {} as Record<string, number>
      };
      
      vulnerabilities.forEach(v => {
        stats.byType[v.type] = (stats.byType[v.type] || 0) + 1;
      });
      
      res.json(stats);
    } catch (error) {
      console.error('Error generating vulnerability stats:', error);
      res.status(500).json({ message: "Failed to generate vulnerability statistics" });
    }
  });

  // Get student performance report
  app.get("/api/reports/student-performance", async (req, res) => {
    try {
      const students = await storage.getAllStudents();
      const performanceData = [];
      
      for (const student of students) {
        const studentScans = await storage.getStudentScansByStudent(student.id);
        const averageScore = studentScans.length > 0 
          ? Math.round(studentScans.reduce((sum, scan) => sum + scan.securityScore, 0) / studentScans.length)
          : 0;
        
        performanceData.push({
          student,
          averageScore,
          totalScans: studentScans.length,
          recentScans: studentScans.slice(0, 5) // Last 5 scans
        });
      }
      
      res.json(performanceData);
    } catch (error) {
      console.error('Error generating student performance report:', error);
      res.status(500).json({ message: "Failed to generate student performance report" });
    }
  });

  // Get assignment performance report
  app.get("/api/reports/assignment-performance/:id", async (req, res) => {
    try {
      const assignment = await storage.getAssignment(req.params.id);
      if (!assignment) {
        return res.status(404).json({ message: "Assignment not found" });
      }
      
      const studentScans = await storage.getStudentScansByAssignment(req.params.id);
      const studentPerformance = new Map();
      
      for (const scan of studentScans) {
        const student = await storage.getStudent(scan.studentId);
        if (!student) continue;
        
        if (!studentPerformance.has(scan.studentId)) {
          studentPerformance.set(scan.studentId, {
            student,
            scores: [],
            averageScore: 0
          });
        }
        
        studentPerformance.get(scan.studentId).scores.push(scan.securityScore);
      }
      
      // Calculate averages
      const results = Array.from(studentPerformance.values()).map(data => ({
        ...data,
        averageScore: Math.round(data.scores.reduce((sum: number, score: number) => sum + score, 0) / data.scores.length)
      }));
      
      res.json({
        assignment,
        studentResults: results,
        classAverage: results.length > 0 
          ? Math.round(results.reduce((sum, r) => sum + r.averageScore, 0) / results.length)
          : 0
      });
    } catch (error) {
      console.error('Error generating assignment performance report:', error);
      res.status(500).json({ message: "Failed to generate assignment performance report" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
