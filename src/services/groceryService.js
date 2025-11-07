// src/services/groceryService.js
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export const groceryService = {
  // Update grocery item stock
  async updateGroceryItemStock(itemId, newStock) {
    try {
      const itemRef = doc(db, 'groceryItems', itemId);
      
      await updateDoc(itemRef, {
        stock: newStock,
        updatedAt: new Date()
      });
      
      console.log(`✅ Stock updated for item ${itemId}: ${newStock}`);
      return true;
    } catch (error) {
      console.error(`❌ Error updating stock for item ${itemId}:`, error);
      throw error;
    }
  },

  // Bulk update multiple items stock
  async bulkUpdateGroceryStock(stockUpdates) {
    try {
      const updatePromises = stockUpdates.map(update => 
        this.updateGroceryItemStock(update.itemId, update.newStock)
      );
      
      await Promise.all(updatePromises);
      console.log('✅ All stock updates completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Error in bulk stock update:', error);
      throw error;
    }
  },

  // Get current stock for an item (optional - for verification)
  async getGroceryItemStock(itemId) {
    try {
      // You might want to implement this if you need to verify stock before updating
      // This would require importing getDoc and the necessary imports
      console.log(`Getting stock for item: ${itemId}`);
      return null; // Implement as needed
    } catch (error) {
      console.error('Error getting grocery item stock:', error);
      throw error;
    }
  }
};