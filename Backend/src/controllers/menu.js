const { MenuItem, Category, RawMaterialGroup } = require("../models/sales");

// =============================================
// CATEGORY CONTROLLERS
// =============================================

// Create category (Manager only)
exports.createCategory = async (req, res) => {
  try {
    const category = new Category(req.body);
    await category.save();

    res.status(201).json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all categories
exports.getCategories = async (req, res) => {
  try {
    const { includeInactive } = req.query;
    const filter = includeInactive ? {} : { isActive: true };

    const categories = await Category.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update category (Manager only)
exports.updateCategory = async (req, res) => {
  try {
    const category = await Category.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });

    res.json({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================
// RAW MATERIAL GROUP CONTROLLERS
// =============================================

// Create raw material group (Manager only)
exports.createRawMaterialGroup = async (req, res) => {
  try {
    const group = new RawMaterialGroup(req.body);
    await group.save();

    res.status(201).json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all raw material groups
exports.getRawMaterialGroups = async (req, res) => {
  try {
    const groups = await RawMaterialGroup.find().sort({ name: 1 });

    res.json({
      success: true,
      data: groups,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update raw material group (Manager only)
exports.updateRawMaterialGroup = async (req, res) => {
  try {
    const group = await RawMaterialGroup.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      data: group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// =============================================
// MENU ITEM CONTROLLERS
// =============================================

// Create menu item (Manager only)
exports.createMenuItem = async (req, res) => {
  try {
    const menuItem = new MenuItem({
      ...req.body,
      priceHistory: [
        {
          price: req.body.price,
          changedAt: new Date(),
          changedBy: req.user.id,
        },
      ],
    });

    await menuItem.save();
    await menuItem.populate("category rawMaterialGroup");

    res.status(201).json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
};

// Get all menu items
exports.getMenuItems = async (req, res) => {
  try {
    const { includeInactive, category, rawMaterialGroup } = req.query;

    let filter = {};

    if (!includeInactive) {
      filter.isActive = true;
    }

    if (category) {
      filter.category = category;
    }

    if (rawMaterialGroup) {
      filter.rawMaterialGroup = rawMaterialGroup;
    }

    const menuItems = await MenuItem.find(filter)
      .populate("category rawMaterialGroup")
      .sort({ name: 1 });

    res.json({
      success: true,
      data: menuItems,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get single menu item
exports.getMenuItem = async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate("category rawMaterialGroup")
      .populate("priceHistory.changedBy", "fullName");

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: "Menu item not found",
      });
    }

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Update menu item (Manager only)
exports.updateMenuItem = async (req, res) => {
  try {
    const { price, ...otherUpdates } = req.body;
    const menuItem = await MenuItem.findById(req.params.id);

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        error: "Menu item not found",
      });
    }

    // If price is being updated, add to price history
    if (price && price !== menuItem.price) {
      menuItem.priceHistory.push({
        price,
        changedAt: new Date(),
        changedBy: req.user.id,
      });
      menuItem.price = price;
    }

    // Update other fields
    Object.assign(menuItem, otherUpdates);
    menuItem.updatedAt = new Date();

    await menuItem.save();
    await menuItem.populate("category rawMaterialGroup");

    res.json({
      success: true,
      data: menuItem,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Delete/Deactivate menu item (Manager only)
exports.deleteMenuItem = async (req, res) => {
  try {
    const { permanent } = req.query;

    if (permanent === "true") {
      await MenuItem.findByIdAndDelete(req.params.id);
    } else {
      await MenuItem.findByIdAndUpdate(req.params.id, { isActive: false });
    }

    res.json({
      success: true,
      message: "Menu item deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};

// Get menu items grouped by category
exports.getMenuByCategory = async (req, res) => {
  try {
    const menuItems = await MenuItem.find({ isActive: true })
      .populate("category rawMaterialGroup")
      .sort({ name: 1 });

    const categories = await Category.find({ isActive: true }).sort({
      name: 1,
    });

    // Group items by category
    const groupedMenu = {};

    // Add categorized items
    categories.forEach((category) => {
      groupedMenu[category.name] = {
        category,
        items: menuItems.filter(
          (item) => item.category?._id.toString() === category._id.toString()
        ),
      };
    });

    // Add uncategorized items
    const uncategorized = menuItems.filter((item) => !item.category);
    if (uncategorized.length > 0) {
      groupedMenu["Uncategorized"] = {
        category: null,
        items: uncategorized,
      };
    }

    res.json({
      success: true,
      data: groupedMenu,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
};
