import { 
  type User, type InsertUser, type Report, type InsertReport,
  type Notice, type InsertNotice, type Visitor, type InsertVisitor,
  type Occurrence, type InsertOccurrence, type ChecklistItem, type InsertChecklistItem,
  type Drill, type InsertDrill, type Campaign, type InsertCampaign,
  type EmergencyAlert, type InsertEmergencyAlert
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  
  // Reports
  createReport(report: InsertReport & { reporterId?: string }): Promise<Report>;
  getReports(): Promise<Report[]>;
  getReport(id: string): Promise<Report | undefined>;
  updateReportStatus(id: string, status: string): Promise<Report | undefined>;
  
  // Notices
  createNotice(notice: InsertNotice & { createdBy: string }): Promise<Notice>;
  getActiveNotices(): Promise<Notice[]>;
  updateNotice(id: string, updates: Partial<Notice>): Promise<Notice | undefined>;
  
  // Visitors
  createVisitor(visitor: InsertVisitor & { registeredBy: string }): Promise<Visitor>;
  getActiveVisitors(): Promise<Visitor[]>;
  getVisitors(): Promise<Visitor[]>;
  checkOutVisitor(id: string): Promise<Visitor | undefined>;
  
  // Occurrences
  createOccurrence(occurrence: InsertOccurrence & { createdBy: string }): Promise<Occurrence>;
  getOccurrences(): Promise<Occurrence[]>;
  
  // Checklist Items
  createChecklistItem(item: InsertChecklistItem): Promise<ChecklistItem>;
  getChecklistItems(): Promise<ChecklistItem[]>;
  updateChecklistItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem | undefined>;
  
  // Drills
  createDrill(drill: InsertDrill & { createdBy: string }): Promise<Drill>;
  getDrills(): Promise<Drill[]>;
  getUpcomingDrills(): Promise<Drill[]>;
  
  // Campaigns
  createCampaign(campaign: InsertCampaign & { createdBy: string }): Promise<Campaign>;
  getActiveCampaigns(): Promise<Campaign[]>;
  updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined>;
  
  // Emergency Alerts
  createEmergencyAlert(alert: InsertEmergencyAlert & { triggeredBy: string }): Promise<EmergencyAlert>;
  getActiveEmergencyAlerts(): Promise<EmergencyAlert[]>;
  resolveEmergencyAlert(id: string, resolvedBy: string): Promise<EmergencyAlert | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private reports: Map<string, Report>;
  private notices: Map<string, Notice>;
  private visitors: Map<string, Visitor>;
  private occurrences: Map<string, Occurrence>;
  private checklistItems: Map<string, ChecklistItem>;
  private drills: Map<string, Drill>;
  private campaigns: Map<string, Campaign>;
  private emergencyAlerts: Map<string, EmergencyAlert>;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.notices = new Map();
    this.visitors = new Map();
    this.occurrences = new Map();
    this.checklistItems = new Map();
    this.drills = new Map();
    this.campaigns = new Map();
    this.emergencyAlerts = new Map();
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async getUserByFirebaseUid(firebaseUid: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.firebaseUid === firebaseUid);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      role: (insertUser.role as "student" | "staff" | "admin") ?? "student",
      id, 
      isActive: true,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  // Reports
  async createReport(reportData: InsertReport & { reporterId?: string }): Promise<Report> {
    const id = randomUUID();
    const report: Report = {
      ...reportData,
      isAnonymous: reportData.isAnonymous ?? false,
      id,
      reporterId: reportData.reporterId || null,
      status: "pending",
      createdAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values());
  }

  async getReport(id: string): Promise<Report | undefined> {
    return this.reports.get(id);
  }

  async updateReportStatus(id: string, status: string): Promise<Report | undefined> {
    const report = this.reports.get(id);
    if (!report) return undefined;
    
    const updatedReport = { ...report, status };
    this.reports.set(id, updatedReport);
    return updatedReport;
  }

  // Notices
  async createNotice(noticeData: InsertNotice & { createdBy: string }): Promise<Notice> {
    const id = randomUUID();
    const notice: Notice = {
      ...noticeData,
      id,
      isActive: true,
      createdAt: new Date()
    };
    this.notices.set(id, notice);
    return notice;
  }

  async getActiveNotices(): Promise<Notice[]> {
    return Array.from(this.notices.values()).filter(notice => notice.isActive);
  }

  async updateNotice(id: string, updates: Partial<Notice>): Promise<Notice | undefined> {
    const notice = this.notices.get(id);
    if (!notice) return undefined;
    
    const updatedNotice = { ...notice, ...updates };
    this.notices.set(id, updatedNotice);
    return updatedNotice;
  }

  // Visitors
  async createVisitor(visitorData: InsertVisitor & { registeredBy: string }): Promise<Visitor> {
    const id = randomUUID();
    const visitor: Visitor = {
      ...visitorData,
      id,
      entryTime: new Date(),
      exitTime: null
    };
    this.visitors.set(id, visitor);
    return visitor;
  }

  async getActiveVisitors(): Promise<Visitor[]> {
    return Array.from(this.visitors.values()).filter(visitor => !visitor.exitTime);
  }

  async getVisitors(): Promise<Visitor[]> {
    return Array.from(this.visitors.values());
  }

  async checkOutVisitor(id: string): Promise<Visitor | undefined> {
    const visitor = this.visitors.get(id);
    if (!visitor) return undefined;
    
    const updatedVisitor = { ...visitor, exitTime: new Date() };
    this.visitors.set(id, updatedVisitor);
    return updatedVisitor;
  }

  // Occurrences
  async createOccurrence(occurrenceData: InsertOccurrence & { createdBy: string }): Promise<Occurrence> {
    const id = randomUUID();
    const occurrence: Occurrence = {
      ...occurrenceData,
      severity: occurrenceData.severity ?? "medium",
      id,
      createdAt: new Date()
    };
    this.occurrences.set(id, occurrence);
    return occurrence;
  }

  async getOccurrences(): Promise<Occurrence[]> {
    return Array.from(this.occurrences.values());
  }

  // Checklist Items
  async createChecklistItem(itemData: InsertChecklistItem): Promise<ChecklistItem> {
    const id = randomUUID();
    const item: ChecklistItem = {
      ...itemData,
      description: itemData.description ?? null,
      id,
      isCompleted: false,
      completedBy: null,
      completedAt: null,
      createdAt: new Date()
    };
    this.checklistItems.set(id, item);
    return item;
  }

  async getChecklistItems(): Promise<ChecklistItem[]> {
    return Array.from(this.checklistItems.values());
  }

  async updateChecklistItem(id: string, updates: Partial<ChecklistItem>): Promise<ChecklistItem | undefined> {
    const item = this.checklistItems.get(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...updates };
    this.checklistItems.set(id, updatedItem);
    return updatedItem;
  }

  // Drills
  async createDrill(drillData: InsertDrill & { createdBy: string }): Promise<Drill> {
    const id = randomUUID();
    const drill: Drill = {
      ...drillData,
      type: drillData.type ?? "evacuation",
      description: drillData.description ?? null,
      id,
      createdAt: new Date()
    };
    this.drills.set(id, drill);
    return drill;
  }

  async getDrills(): Promise<Drill[]> {
    return Array.from(this.drills.values());
  }

  async getUpcomingDrills(): Promise<Drill[]> {
    const now = new Date();
    return Array.from(this.drills.values()).filter(drill => drill.scheduledDate > now);
  }

  // Campaigns
  async createCampaign(campaignData: InsertCampaign & { createdBy: string }): Promise<Campaign> {
    const id = randomUUID();
    const campaign: Campaign = {
      ...campaignData,
      id,
      isActive: true,
      createdAt: new Date()
    };
    this.campaigns.set(id, campaign);
    return campaign;
  }

  async getActiveCampaigns(): Promise<Campaign[]> {
    return Array.from(this.campaigns.values()).filter(campaign => campaign.isActive);
  }

  async updateCampaign(id: string, updates: Partial<Campaign>): Promise<Campaign | undefined> {
    const campaign = this.campaigns.get(id);
    if (!campaign) return undefined;
    
    const updatedCampaign = { ...campaign, ...updates };
    this.campaigns.set(id, updatedCampaign);
    return updatedCampaign;
  }

  // Emergency Alerts
  async createEmergencyAlert(alertData: InsertEmergencyAlert & { triggeredBy: string }): Promise<EmergencyAlert> {
    const id = randomUUID();
    const alert: EmergencyAlert = {
      ...alertData,
      location: alertData.location ?? null,
      id,
      isResolved: false,
      resolvedBy: null,
      resolvedAt: null,
      createdAt: new Date()
    };
    this.emergencyAlerts.set(id, alert);
    return alert;
  }

  async getActiveEmergencyAlerts(): Promise<EmergencyAlert[]> {
    return Array.from(this.emergencyAlerts.values()).filter(alert => !alert.isResolved);
  }

  async resolveEmergencyAlert(id: string, resolvedBy: string): Promise<EmergencyAlert | undefined> {
    const alert = this.emergencyAlerts.get(id);
    if (!alert) return undefined;
    
    const updatedAlert = { 
      ...alert, 
      isResolved: true, 
      resolvedBy, 
      resolvedAt: new Date() 
    };
    this.emergencyAlerts.set(id, updatedAlert);
    return updatedAlert;
  }
}

export const storage = new MemStorage();
