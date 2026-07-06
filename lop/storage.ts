import { 
  type Scan, type InsertScan, type Vulnerability, type InsertVulnerability,
  type Student, type InsertStudent, type Assignment, type InsertAssignment,
  type BatchScan, type InsertBatchScan, type StudentScan, type InsertStudentScan
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Scan operations
  createScan(scan: InsertScan): Promise<Scan>;
  getScan(id: string): Promise<Scan | undefined>;
  getAllScans(): Promise<Scan[]>;
  updateScan(id: string, updates: Partial<Scan>): Promise<Scan | undefined>;
  
  // Vulnerability operations
  createVulnerability(vulnerability: InsertVulnerability): Promise<Vulnerability>;
  getVulnerabilitiesByScanId(scanId: string): Promise<Vulnerability[]>;
  getAllVulnerabilities(): Promise<Vulnerability[]>;
  
  // Student operations
  createStudent(student: InsertStudent): Promise<Student>;
  getStudent(id: string): Promise<Student | undefined>;
  getAllStudents(): Promise<Student[]>;
  updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined>;
  
  // Assignment operations
  createAssignment(assignment: InsertAssignment): Promise<Assignment>;
  getAssignment(id: string): Promise<Assignment | undefined>;
  getAllAssignments(): Promise<Assignment[]>;
  updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | undefined>;
  
  // Batch scan operations
  createBatchScan(batchScan: InsertBatchScan): Promise<BatchScan>;
  getBatchScan(id: string): Promise<BatchScan | undefined>;
  getAllBatchScans(): Promise<BatchScan[]>;
  updateBatchScan(id: string, updates: Partial<BatchScan>): Promise<BatchScan | undefined>;
  
  // Student scan operations
  createStudentScan(studentScan: InsertStudentScan): Promise<StudentScan>;
  getStudentScansByStudent(studentId: string): Promise<StudentScan[]>;
  getStudentScansByAssignment(assignmentId: string): Promise<StudentScan[]>;
  calculateSecurityScore(scanId: string): Promise<number>;
}

export class MemStorage implements IStorage {
  private scans: Map<string, Scan>;
  private vulnerabilities: Map<string, Vulnerability>;
  private students: Map<string, Student>;
  private assignments: Map<string, Assignment>;
  private batchScans: Map<string, BatchScan>;
  private studentScans: Map<string, StudentScan>;

  constructor() {
    this.scans = new Map();
    this.vulnerabilities = new Map();
    this.students = new Map();
    this.assignments = new Map();
    this.batchScans = new Map();
    this.studentScans = new Map();
  }

  async createScan(insertScan: InsertScan): Promise<Scan> {
    const id = randomUUID();
    const scan: Scan = {
      ...insertScan,
      id,
      status: "pending" as const,
      authType: (insertScan.authType || "none") as "none" | "basic" | "form" | "cookie",
      intensity: (insertScan.intensity || "medium") as "low" | "medium" | "high",
      enabledModules: insertScan.enabledModules || [],
      progress: 0,
      currentModule: null,
      requestsSent: 0,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };
    this.scans.set(id, scan);
    return scan;
  }

  async getScan(id: string): Promise<Scan | undefined> {
    return this.scans.get(id);
  }

  async getAllScans(): Promise<Scan[]> {
    return Array.from(this.scans.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateScan(id: string, updates: Partial<Scan>): Promise<Scan | undefined> {
    const scan = this.scans.get(id);
    if (!scan) return undefined;
    
    const updatedScan = { ...scan, ...updates };
    this.scans.set(id, updatedScan);
    return updatedScan;
  }

  async createVulnerability(insertVulnerability: InsertVulnerability): Promise<Vulnerability> {
    const id = randomUUID();
    const vulnerability: Vulnerability = {
      ...insertVulnerability,
      id,
      severity: insertVulnerability.severity as "low" | "medium" | "high" | "critical",
      parameter: insertVulnerability.parameter || null,
      payload: insertVulnerability.payload || null,
      evidence: insertVulnerability.evidence || null,
      cweId: insertVulnerability.cweId || null,
      cvssScore: insertVulnerability.cvssScore || null,
      detectedAt: new Date(),
    };
    this.vulnerabilities.set(id, vulnerability);
    return vulnerability;
  }

  async getVulnerabilitiesByScanId(scanId: string): Promise<Vulnerability[]> {
    return Array.from(this.vulnerabilities.values())
      .filter(vuln => vuln.scanId === scanId)
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  async getAllVulnerabilities(): Promise<Vulnerability[]> {
    return Array.from(this.vulnerabilities.values())
      .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());
  }

  // Student operations
  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    const id = randomUUID();
    const student: Student = {
      ...insertStudent,
      id,
      studentId: insertStudent.studentId || null,
      group: insertStudent.group || null,
      createdAt: new Date(),
    };
    this.students.set(id, student);
    return student;
  }

  async getStudent(id: string): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getAllStudents(): Promise<Student[]> {
    return Array.from(this.students.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateStudent(id: string, updates: Partial<Student>): Promise<Student | undefined> {
    const student = this.students.get(id);
    if (!student) return undefined;
    
    const updatedStudent = { ...student, ...updates };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  // Assignment operations
  async createAssignment(insertAssignment: InsertAssignment): Promise<Assignment> {
    const id = randomUUID();
    const assignment: Assignment = {
      ...insertAssignment,
      id,
      maxScore: insertAssignment.maxScore || 100,
      dueDate: insertAssignment.dueDate || null,
      isActive: insertAssignment.isActive !== undefined ? insertAssignment.isActive : true,
      createdAt: new Date(),
    };
    this.assignments.set(id, assignment);
    return assignment;
  }

  async getAssignment(id: string): Promise<Assignment | undefined> {
    return this.assignments.get(id);
  }

  async getAllAssignments(): Promise<Assignment[]> {
    return Array.from(this.assignments.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateAssignment(id: string, updates: Partial<Assignment>): Promise<Assignment | undefined> {
    const assignment = this.assignments.get(id);
    if (!assignment) return undefined;
    
    const updatedAssignment = { ...assignment, ...updates };
    this.assignments.set(id, updatedAssignment);
    return updatedAssignment;
  }

  // Batch scan operations
  async createBatchScan(insertBatchScan: InsertBatchScan): Promise<BatchScan> {
    const id = randomUUID();
    const batchScan: BatchScan = {
      ...insertBatchScan,
      id,
      status: "pending" as const,
      totalScans: insertBatchScan.targetUrls.length,
      completedScans: 0,
      startedAt: null,
      completedAt: null,
      createdAt: new Date(),
    };
    this.batchScans.set(id, batchScan);
    return batchScan;
  }

  async getBatchScan(id: string): Promise<BatchScan | undefined> {
    return this.batchScans.get(id);
  }

  async getAllBatchScans(): Promise<BatchScan[]> {
    return Array.from(this.batchScans.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async updateBatchScan(id: string, updates: Partial<BatchScan>): Promise<BatchScan | undefined> {
    const batchScan = this.batchScans.get(id);
    if (!batchScan) return undefined;
    
    const updatedBatchScan = { ...batchScan, ...updates };
    this.batchScans.set(id, updatedBatchScan);
    return updatedBatchScan;
  }

  // Student scan operations
  async createStudentScan(insertStudentScan: InsertStudentScan): Promise<StudentScan> {
    const id = randomUUID();
    const studentScan: StudentScan = {
      ...insertStudentScan,
      id,
      securityScore: insertStudentScan.securityScore || 0,
      completedAt: new Date(),
    };
    this.studentScans.set(id, studentScan);
    return studentScan;
  }

  async getStudentScansByStudent(studentId: string): Promise<StudentScan[]> {
    return Array.from(this.studentScans.values())
      .filter(scan => scan.studentId === studentId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  async getStudentScansByAssignment(assignmentId: string): Promise<StudentScan[]> {
    return Array.from(this.studentScans.values())
      .filter(scan => scan.assignmentId === assignmentId)
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
  }

  async calculateSecurityScore(scanId: string): Promise<number> {
    const vulnerabilities = await this.getVulnerabilitiesByScanId(scanId);
    
    // Calculate score based on vulnerability severity and count
    let totalDeductions = 0;
    const severityWeights = {
      'critical': 25,
      'high': 15,
      'medium': 8,
      'low': 3
    };
    
    vulnerabilities.forEach(vuln => {
      const weight = severityWeights[vuln.severity] || 0;
      totalDeductions += weight;
    });
    
    // Base score of 100, deduct points for each vulnerability
    const score = Math.max(0, 100 - totalDeductions);
    return score;
  }
}

export const storage = new MemStorage();
