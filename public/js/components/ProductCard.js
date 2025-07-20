import { formatCurrency, showToast } from "../utils/helpers.js?v=2024"

/**
 * Creates a product card component.
 * @param {object} product - The product data object.
 * @returns {string} The HTML string for the product card.
 */
export function ProductCard(product) {
  // Handle backend data structure
  const finalPrice = product.final_price || product.price
  const originalPrice = product.price
  const hasDiscount = (product.discount_percentage || 0) > 0
  const categoryName = product.category?.name || product.category || 'Uncategorized'
  const productSlug = product.slug || product.id
  const rating = product.average_rating || product.rating || 0
  const reviewsCount = product.total_reviews || product.reviews_count || 0
  const isInStock = product.in_stock !== undefined ? product.in_stock : (product.stock || 0) > 0

  // Get primary image
  let imageUrl = 'https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=' + encodeURIComponent(product.name)
  if (product.image_urls && product.image_urls.length > 0) {
    imageUrl = product.image_urls[0]
  } else if (product.images && product.images.length > 0) {
    imageUrl = product.images.find(img => img.is_primary)?.image || product.images[0]?.image
  }

  return `
    <div class="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden" onclick="location.hash='/products/${productSlug}'">
      <!-- Product Image -->
      <div class="relative overflow-hidden">
        <img src="${imageUrl}"
             alt="${product.name}"
             class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
             onerror="this.src='https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=' + encodeURIComponent('${product.name}'); this.onerror=null;">

        <!-- Discount Badge -->
        ${hasDiscount ? `
          <div class="absolute top-3 left-3 bg-danger text-white px-2 py-1 rounded-full text-xs font-bold">
            -${Math.round(product.discount_percentage)}%
          </div>
        ` : ''}

        <!-- Action Buttons -->
        <div class="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button class="bg-white p-3 rounded-full shadow-md hover:bg-secondary hover:text-white transition-colors"
                  onclick="event.stopPropagation(); toggleWishlist('${productSlug}')"
                  title="Add to Wishlist">
            <i class="fa-solid fa-heart ${product.is_liked ? 'text-red-500' : ''}"></i>
          </button>
          <button class="bg-white p-3 rounded-full shadow-md hover:bg-secondary hover:text-white transition-colors"
                  onclick="event.stopPropagation(); addToCart('${productSlug}')"
                  title="Add to Cart">
            <i class="fa-solid fa-shopping-cart"></i>
          </button>
          <button class="bg-white p-3 rounded-full shadow-md hover:bg-secondary hover:text-white transition-colors"
                  onclick="event.stopPropagation(); quickView('${productSlug}')"
                  title="Quick View">
            <i class="fa-solid fa-eye"></i>
          </button>
        </div>
      </div>

      <!-- Product Info -->
      <div class="p-4 space-y-3">
        <!-- Category -->
        <div class="flex items-center justify-between">
          <span class="text-xs font-medium text-secondary bg-secondary bg-opacity-10 px-2 py-1 rounded-full">
            ${categoryName}
          </span>
          ${isInStock ?
            '<span class="text-xs text-success font-medium">In Stock</span>' :
            '<span class="text-xs text-danger font-medium">Out of Stock</span>'
          }
        </div>

        <!-- Product Name -->
        <h3 class="font-semibold text-gray-800 group-hover:text-secondary transition-colors line-clamp-2 leading-tight">
          ${product.name}
        </h3>

        <!-- Rating -->
        ${rating > 0 ? `
          <div class="flex items-center gap-2">
            <div class="flex text-yellow-400 text-sm">
              ${Array.from({length: 5}, (_, i) => `
                <i class="fa-solid fa-star ${i < Math.floor(rating) ? '' : 'text-gray-300'}"></i>
              `).join('')}
            </div>
            <span class="text-xs text-gray-500">${rating.toFixed(1)}</span>
            <span class="text-xs text-gray-400">(${reviewsCount})</span>
          </div>
        ` : ''}

        <!-- Price -->
        <div class="flex items-center justify-between pt-2">
          <div class="flex flex-col">
            ${hasDiscount ? `
              <div class="flex items-center gap-2">
                <span class="text-lg font-bold text-secondary">${formatCurrency(finalPrice)}</span>
                <span class="text-sm text-gray-500 line-through">${formatCurrency(originalPrice)}</span>
              </div>
            ` : `
              <span class="text-lg font-bold text-gray-800">${formatCurrency(finalPrice)}</span>
            `}
          </div>
        </div>
      </div>
    </div>
  `
}

// Utility functions for product card interactions
window.toggleWishlist = async function(productSlug) {
  try {
    // Import cart service dynamically to avoid circular dependencies
    const { cartService } = await import('../services/api.js')

    // For now, use save item functionality as wishlist
    await cartService.saveItem(productSlug)
    showToast('Added to wishlist!', 'success')
  } catch (error) {
    console.error('Failed to add to wishlist:', error)
    showToast('Failed to add to wishlist', 'error')
  }
}

window.addToCart = async function(productSlug) {
  try {
    // Check if cart component is available
    if (window.cart) {
      await window.cart.addToCart(productSlug, 1)
    } else {
      // Fallback to direct API call
      const { cartService } = await import('../services/api.js')
      await cartService.addToCart(productSlug, 1)
      showToast('Added to cart!', 'success')
    }
  } catch (error) {
    console.error('Failed to add to cart:', error)
    showToast('Failed to add to cart', 'error')
  }
}

window.quickView = function(productSlug) {
  // Navigate to product detail page
  location.hash = `/products/${productSlug}`
}
