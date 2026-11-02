const Complaint = require("../models/Complaint");
const User = require("../models/User");
const Block = require("../models/Block");
const path = require("path");
const { sendComplaintNotification } = require("../utils/emailService");

exports.deleteComplaint = async (req, res) => {
  try {
    const requester = req.user;
    if (requester.role !== "SuperAdmin") {
      return res
        .status(403)
        .json({ message: "Only SuperAdmin can delete complaints" });
    }
    const complaint = await Complaint.findByIdAndDelete(req.params.id);
    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }
    res.json({ message: "Complaint deleted" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete complaint", error: error.message });
  }
};

exports.createComplaint = async (req, res) => {
  try {
    const {
      blockName,
      roomNumber,
      complaintType,
      remarks,
      userId,
      departmentName,
      programmeName,
    } = req.body;

    if (!blockName || !roomNumber || !complaintType) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Only SuperAdmin and regular Users can create complaints
    const requester = req.user || {};
    if (requester.role && !["SuperAdmin", "User"].includes(requester.role)) {
      return res
        .status(403)
        .json({ message: "You do not have permission to create complaints" });
    }

    const complaint = new Complaint({
      departmentName,
      programmeName,
      blockName,
      roomNumber,
      complaintType,
      remarks,
      createdBy: req.user?.id || userId,
    });

    if (req.file) {
      complaint.attachment = `/uploads/${req.file.filename}`;
    }

    await complaint.save();

    // Send email notification to ramachandranboominathan@gmail.com asynchronously
    User.findById(complaint.createdBy)
      .select("username email phone")
      .then((creator) => {
        console.log(`[Complaint Created] Triggering email for #${complaint._id}`);
        sendComplaintNotification(complaint, creator)
          .then((result) => {
            console.log(`[Complaint Notification Sent]:`, result);
          })
          .catch((err) => {
            console.error("[Email Notification Error]:", err.message);
          });
      })
      .catch((err) => {
        console.error("[Email Notification Creator Lookup Error]:", err.message);
      });

    res.status(201).json({ message: "Complaint created", complaint });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to create complaint", error: error.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    // SuperAdmin: global stats
    if (requester.role === "SuperAdmin") {
      const all = await Complaint.find();
      const total = all.length;
      const pending = all.filter((c) => c.status === "Pending").length;
      const assigned = all.filter((c) => c.status === "Assigned").length;
      const closed = all.filter((c) => c.status === "Completed").length;
      return res.json({ total, pending, assigned, closed });
    }

    // Staff/Technician: stats for complaints assigned to them or their department
    if (!["SuperAdmin", "User"].includes(requester.role)) {
      let filter = { assignedTo: requester.id };

      // If staff has a department assigned, also get complaints for all staff in that dept
      if (requester.department) {
        const sameDeptStaff = await User.find({
          department: requester.department,
        }).select("_id");
        const staffIds = sameDeptStaff.map((u) => u._id);
        filter = {
          $or: [{ assignedTo: { $in: staffIds } }, { createdBy: requester.id }],
        };
      } else {
        // Fallback: if no department, just show assigned to this user
        filter = { assignedTo: requester.id };
      }

      const assignedList = await Complaint.find(filter);
      const total = assignedList.length;
      const pending = assignedList.filter((c) => c.status === "Pending").length;
      const assigned = assignedList.filter(
        (c) => c.status === "Assigned",
      ).length;
      const closed = assignedList.filter(
        (c) => c.status === "Completed",
      ).length;
      return res.json({ total, pending, assigned, closed });
    }

    // Regular User: stats for complaints created by them
    const myList = await Complaint.find({ createdBy: requester.id });
    const total = myList.length;
    const pending = myList.filter((c) => c.status === "Pending").length;
    const assigned = myList.filter((c) => c.status === "Assigned").length;
    const closed = myList.filter((c) => c.status === "Completed").length;
    res.json({ total, pending, assigned, closed });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch stats", error: error.message });
  }
};

exports.listComplaints = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester) return res.status(401).json({ message: "Unauthorized" });

    // SuperAdmin: all complaints
    if (requester.role === "SuperAdmin") {
      const complaints = await Complaint.find()
        .populate({
          path: "createdBy",
          select: "username email department",
          populate: { path: "department", select: "name" },
        })
        .populate({
          path: "assignedTo",
          select: "username email role department",
          populate: { path: "department", select: "name" },
        })
        .sort({ createdAt: -1 });
      return res.json(complaints);
    }

    // Staff/Technician: complaints assigned to them or their department
    if (!["SuperAdmin", "User"].includes(requester.role)) {
      let filter = { assignedTo: requester.id };

      // If staff has a department assigned, also get complaints for all staff in that dept
      if (requester.department) {
        const sameDeptStaff = await User.find({
          department: requester.department,
        }).select("_id");
        const staffIds = sameDeptStaff.map((u) => u._id);
        filter = {
          $or: [{ assignedTo: { $in: staffIds } }, { createdBy: requester.id }],
        };
      }

      const complaints = await Complaint.find(filter)
        .populate({
          path: "createdBy",
          select: "username email department",
          populate: { path: "department", select: "name" },
        })
        .populate({
          path: "assignedTo",
          select: "username email role department",
          populate: { path: "department", select: "name" },
        })
        .sort({ createdAt: -1 });
      return res.json(complaints);
    }

    // Regular User: complaints raised by them
    const complaints = await Complaint.find({ createdBy: requester.id })
      .populate({
        path: "createdBy",
        select: "username email department",
        populate: { path: "department", select: "name" },
      })
      .populate({
        path: "assignedTo",
        select: "username email role department",
        populate: { path: "department", select: "name" },
      })
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to list complaints", error: error.message });
  }
};

// SuperAdmin assigns complaint to a staff user
exports.assignComplaint = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || requester.role !== "SuperAdmin") {
      return res
        .status(403)
        .json({ message: "Only SuperAdmin can assign complaints" });
    }

    const complaintId = req.params.id;
    const { assignedTo } = req.body; // user id
    if (!assignedTo)
      return res.status(400).json({ message: "assignedTo is required" });

    const assignee = await User.findById(assignedTo);
    if (!assignee)
      return res.status(404).json({ message: "Assignee not found" });

    const complaint = await Complaint.findById(complaintId);
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    complaint.assignedTo = assignee._id;
    complaint.status = "Assigned";
    await complaint.save();

    const updated = await Complaint.findById(complaintId).populate(
      "assignedTo",
      "username email role",
    );
    res.json({ message: "Assigned successfully", complaint: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to assign complaint", error: error.message });
  }
};

// Assigned staff (or SuperAdmin) can update status to Closed
exports.updateStatus = async (req, res) => {
  try {
    const requester = req.user;
    const complaintId = req.params.id;
    let { status } = req.body; // expected 'Completed'
    if (!status) return res.status(400).json({ message: "status is required" });

    const allowedStatuses = [
      "Pending",
      "Assigned",
      "In-Progress",
      "Onhold",
      "Completed",
    ];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const complaint = await Complaint.findById(complaintId)
      .populate("assignedTo", "_id")
      .populate("createdBy", "_id");
    if (!complaint)
      return res.status(404).json({ message: "Complaint not found" });

    // If requester is SuperAdmin, allow any change
    if (requester.role === "SuperAdmin") {
      complaint.status = status;
      await complaint.save();
      const updated = await Complaint.findById(complaintId).populate(
        "assignedTo",
        "username email",
      );
      return res.json({ message: "Status updated", complaint: updated });
    }

    // Staff/Technician: must be assignedTo and can set limited statuses
    const isAssignee =
      complaint.assignedTo &&
      String(complaint.assignedTo._id) === String(requester.id);

    if (!isAssignee)
      return res.status(403).json({
        message: "Only assigned staff can update status",
      });

    if (isAssignee) {
      const staffAllowed = ["In-Progress", "Onhold", "Completed"];
      if (!staffAllowed.includes(status))
        return res
          .status(403)
          .json({ message: "Assigned staff cannot set this status" });
    }

    complaint.status = status;
    await complaint.save();
    const updated = await Complaint.findById(complaintId).populate(
      "assignedTo",
      "username email",
    );
    res.json({ message: "Status updated", complaint: updated });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update status", error: error.message });
  }
};

// SuperAdmin: generate filtered reports
exports.generateReport = async (req, res) => {
  try {
    const requester = req.user;
    if (!requester || requester.role !== "SuperAdmin")
      return res
        .status(403)
        .json({ message: "Only SuperAdmin can generate reports" });

    const { department, programme, complaintType, status, assignee, assigneeRole } =
      req.query;

    const filter = {};
    if (complaintType)
      filter.complaintType = { $regex: complaintType.trim(), $options: "i" };
    if (status) filter.status = status;
    if (assignee) filter.assignedTo = assignee;

    // Filter by the role of the assigned staff member
    if (assigneeRole) {
      const usersWithRole = await User.find({ role: assigneeRole }).select("_id");
      const userIds = usersWithRole.map(u => u._id);

      if (filter.assignedTo) {
        // If both assignee and role filters are applied, Ensure the selected assignee has that role
        if (!userIds.some(id => String(id) === String(filter.assignedTo))) {
          // No match possible
          return res.json([]);
        }
      } else {
        filter.assignedTo = { $in: userIds };
      }
    }

    // If department or programme are provided, resolve their names and filter by name
    if (department) {
      const deptDoc = await require("../models/Department").findById(
        department,
      );
      if (deptDoc) {
        filter.departmentName = deptDoc.name;
      }
    }
    if (programme) {
      const progDoc = await require("../models/Programme").findById(programme);
      if (progDoc) {
        filter.programmeName = progDoc.name;
      }
    }

    const complaints = await Complaint.find(filter)
      .populate({
        path: "createdBy",
        select: "username email department programme",
        populate: [
          { path: "department", select: "name" },
          { path: "programme", select: "name" },
        ],
      })
      .populate({ path: "assignedTo", select: "username email role" })
      .sort({ createdAt: -1 });

    res.json(complaints);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to generate report", error: error.message });
  }
};
