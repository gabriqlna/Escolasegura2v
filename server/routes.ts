import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertUserSchema, insertReportSchema, insertNoticeSchema, insertVisitorSchema,
  insertOccurrenceSchema, insertChecklistItemSchema, insertDrillSchema, 
  insertCampaignSchema, insertEmergencyAlertSchema,
  updateUserSchema, updateNoticeSchema, updateCampaignSchema, 
  updateChecklistItemSchema, reportStatusSchema
} from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Helper function for error handling
  const handleAsync = (fn: Function) => (req: any, res: any, next: any) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

  // Helper function for validation
  const validateBody = (schema: any) => (req: any, res: any, next: any) => {
    try {
      req.validatedBody = schema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({ error: "Validation failed", details: error.errors });
    }
  };

  // Authentication middleware
  const requireAuth = () => (req: any, res: any, next: any) => {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }
    req.userId = userId;
    next();
  };

  // Helper to verify user exists
  const verifyUser = async (userId: string) => {
    const user = await storage.getUser(userId);
    if (!user || !user.isActive) {
      return null;
    }
    return user;
  };

  // Role-based authorization middleware
  const requireRole = (allowedRoles: string[]) => (req: any, res: any, next: any) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    next();
  };

  // Users API
  app.get("/api/users", handleAsync(async (req: any, res: any) => {
    const users = await storage.getAllUsers();
    res.json(users);
  }));

  app.get("/api/users/:id", handleAsync(async (req: any, res: any) => {
    const user = await storage.getUser(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(user);
  }));

  app.post("/api/users", validateBody(insertUserSchema), handleAsync(async (req: any, res: any) => {
    const user = await storage.createUser(req.validatedBody);
    res.status(201).json(user);
  }));

  app.patch("/api/users/:id", requireAuth(), validateBody(updateUserSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    
    // Users can only update their own profile, or admin can update anyone
    if (req.params.id !== req.userId && user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: can only update own profile" });
    }
    
    // Prevent role escalation - only admin can change roles
    if (req.validatedBody.role && user.role !== 'admin') {
      return res.status(403).json({ error: "Forbidden: cannot change role" });
    }
    
    const updatedUser = await storage.updateUser(req.params.id, req.validatedBody);
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json(updatedUser);
  }));

  // Reports API
  app.get("/api/reports", handleAsync(async (req: any, res: any) => {
    const reports = await storage.getReports();
    res.json(reports);
  }));

  app.post("/api/reports", validateBody(insertReportSchema), handleAsync(async (req: any, res: any) => {
    // Get user ID from Firebase token or session (simplified for now)
    const reporterId = req.headers['x-user-id'] || undefined;
    const report = await storage.createReport({
      ...req.validatedBody,
      reporterId: req.validatedBody.isAnonymous ? undefined : reporterId
    });
    res.status(201).json(report);
  }));

  app.patch("/api/reports/:id/status", requireAuth(), validateBody(reportStatusSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    
    // Only staff and admin can update report status
    if (user.role === 'student') {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    
    const report = await storage.updateReportStatus(req.params.id, req.validatedBody.status);
    if (!report) {
      return res.status(404).json({ error: "Report not found" });
    }
    res.json(report);
  }));

  // Notices API
  app.get("/api/notices", handleAsync(async (req: any, res: any) => {
    const notices = await storage.getActiveNotices();
    res.json(notices);
  }));

  app.post("/api/notices", requireAuth(), validateBody(insertNoticeSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    const notice = await storage.createNotice({
      ...req.validatedBody,
      createdBy: req.userId
    });
    res.status(201).json(notice);
  }));

  app.patch("/api/notices/:id", requireAuth(), validateBody(updateNoticeSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    
    // Only staff and admin can update notices
    if (user.role === 'student') {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    
    const notice = await storage.updateNotice(req.params.id, req.validatedBody);
    if (!notice) {
      return res.status(404).json({ error: "Notice not found" });
    }
    res.json(notice);
  }));

  // Visitors API
  app.get("/api/visitors", handleAsync(async (req: any, res: any) => {
    const visitors = await storage.getVisitors();
    res.json(visitors);
  }));

  app.get("/api/visitors/active", handleAsync(async (req: any, res: any) => {
    const visitors = await storage.getActiveVisitors();
    res.json(visitors);
  }));

  app.post("/api/visitors", requireAuth(), validateBody(insertVisitorSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    const visitor = await storage.createVisitor({
      ...req.validatedBody,
      registeredBy: req.userId
    });
    res.status(201).json(visitor);
  }));

  app.patch("/api/visitors/:id/checkout", requireAuth(), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    
    const visitor = await storage.checkOutVisitor(req.params.id);
    if (!visitor) {
      return res.status(404).json({ error: "Visitor not found" });
    }
    res.json(visitor);
  }));

  // Occurrences API
  app.get("/api/occurrences", handleAsync(async (req: any, res: any) => {
    const occurrences = await storage.getOccurrences();
    res.json(occurrences);
  }));

  app.post("/api/occurrences", requireAuth(), validateBody(insertOccurrenceSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    const occurrence = await storage.createOccurrence({
      ...req.validatedBody,
      createdBy: req.userId
    });
    res.status(201).json(occurrence);
  }));

  // Checklist Items API
  app.get("/api/checklist", handleAsync(async (req: any, res: any) => {
    const items = await storage.getChecklistItems();
    res.json(items);
  }));

  app.post("/api/checklist", requireAuth(), validateBody(insertChecklistItemSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    
    // Only staff and admin can create checklist items
    if (user.role === 'student') {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    
    const item = await storage.createChecklistItem(req.validatedBody);
    res.status(201).json(item);
  }));

  app.patch("/api/checklist/:id", validateBody(updateChecklistItemSchema), handleAsync(async (req: any, res: any) => {
    let updates = { ...req.validatedBody };
    
    if (req.validatedBody.isCompleted !== undefined) {
      const userId = req.headers['x-user-id'];
      if (!userId) {
        return res.status(401).json({ error: "Authentication required to complete items" });
      }
      
      const user = await verifyUser(userId);
      if (!user) {
        return res.status(401).json({ error: "Invalid user" });
      }
      
      if (req.validatedBody.isCompleted) {
        updates = {
          ...updates,
          completedBy: userId,
          completedAt: new Date()
        };
      } else {
        updates = {
          ...updates,
          completedBy: null,
          completedAt: null
        };
      }
    }
    
    const item = await storage.updateChecklistItem(req.params.id, updates);
    if (!item) {
      return res.status(404).json({ error: "Checklist item not found" });
    }
    res.json(item);
  }));

  // Drills API
  app.get("/api/drills", handleAsync(async (req: any, res: any) => {
    const drills = await storage.getDrills();
    res.json(drills);
  }));

  app.get("/api/drills/upcoming", handleAsync(async (req: any, res: any) => {
    const drills = await storage.getUpcomingDrills();
    res.json(drills);
  }));

  app.post("/api/drills", requireAuth(), validateBody(insertDrillSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    const drill = await storage.createDrill({
      ...req.validatedBody,
      createdBy: req.userId
    });
    res.status(201).json(drill);
  }));

  // Campaigns API
  app.get("/api/campaigns", handleAsync(async (req: any, res: any) => {
    const campaigns = await storage.getActiveCampaigns();
    res.json(campaigns);
  }));

  app.post("/api/campaigns", requireAuth(), validateBody(insertCampaignSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    const campaign = await storage.createCampaign({
      ...req.validatedBody,
      createdBy: req.userId
    });
    res.status(201).json(campaign);
  }));

  app.patch("/api/campaigns/:id", requireAuth(), validateBody(updateCampaignSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    
    // Only staff and admin can update campaigns
    if (user.role === 'student') {
      return res.status(403).json({ error: "Forbidden: insufficient permissions" });
    }
    
    const campaign = await storage.updateCampaign(req.params.id, req.validatedBody);
    if (!campaign) {
      return res.status(404).json({ error: "Campaign not found" });
    }
    res.json(campaign);
  }));

  // Emergency Alerts API
  app.get("/api/emergency-alerts", handleAsync(async (req: any, res: any) => {
    const alerts = await storage.getActiveEmergencyAlerts();
    res.json(alerts);
  }));

  app.post("/api/emergency-alerts", requireAuth(), validateBody(insertEmergencyAlertSchema), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    const alert = await storage.createEmergencyAlert({
      ...req.validatedBody,
      triggeredBy: req.userId
    });
    res.status(201).json(alert);
  }));

  app.patch("/api/emergency-alerts/:id/resolve", requireAuth(), handleAsync(async (req: any, res: any) => {
    const user = await verifyUser(req.userId);
    if (!user) {
      return res.status(401).json({ error: "Invalid user" });
    }
    const alert = await storage.resolveEmergencyAlert(req.params.id, req.userId);
    if (!alert) {
      return res.status(404).json({ error: "Emergency alert not found" });
    }
    res.json(alert);
  }));

  // Dashboard stats API
  app.get("/api/dashboard/stats", handleAsync(async (req: any, res: any) => {
    const [users, reports, activeVisitors, activeAlerts, upcomingDrills] = await Promise.all([
      storage.getAllUsers(),
      storage.getReports(),
      storage.getActiveVisitors(),
      storage.getActiveEmergencyAlerts(),
      storage.getUpcomingDrills()
    ]);

    const stats = {
      totalUsers: users.length,
      pendingReports: reports.filter(r => r.status === 'pending').length,
      activeVisitors: activeVisitors.length,
      activeAlerts: activeAlerts.length,
      upcomingDrills: upcomingDrills.length,
      recentReports: reports.slice(-5).reverse()
    };

    res.json(stats);
  }));

  // Error handling middleware
  app.use((error: any, req: any, res: any, next: any) => {
    console.error('API Error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  });

  const httpServer = createServer(app);

  return httpServer;
}
