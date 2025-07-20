/**
 * Cart Page Component
 * Displays shopping cart with items and checkout functionality
 */

import { createElementFromHTML, formatCurrency, showToast } from "../utils/helpers.js"
import { cartService } from "../services/api.js"
import store from "../state/store.js"

export default function CartPage() {
  const page = createElementFromHTML(`
    <div class="container mx-auto px-4 py-8">
      <div class="max-w-6xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <h1 class="text-3xl font-bold text-primary mb-2">Shopping Cart</h1>
          <p class="text-gray-600">Review your items and proceed to checkout</p>
        </div>

        <!-- Cart Content -->
        <div id="cart-content" class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Loading State -->
          <div class="lg:col-span-3 flex justify-center py-12">
            <div class="text-center">
              <div class="loader w-12 h-12 border-4 border-gray-200 border-t-secondary rounded-full animate-spin mx-auto mb-4"></div>
              <p class="text-gray-500">Loading your cart...</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `)

  // Initialize cart page
  initializeCartPage(page)

  return page
}

function initializeCartPage(page) {
  let cartData = null
  let isLoading = false

  // Load cart data
  async function loadCart() {
    try {
      isLoading = true
      const response = await cartService.getCart()
      cartData = response
      renderCart()
    } catch (error) {
      console.error('Failed to load cart:', error)
      renderError()
    } finally {
      isLoading = false
    }
  }

  // Render cart content
  function renderCart() {
    const container = page.querySelector('#cart-content')
    
    if (!cartData || !cartData.items || cartData.items.length === 0) {
      container.innerHTML = `
        <div class="lg:col-span-3 text-center py-12">
          <div class="max-w-md mx-auto">
            <i class="fa-solid fa-shopping-cart text-6xl text-gray-300 mb-4"></i>
            <h2 class="text-2xl font-bold text-gray-800 mb-2">Your cart is empty</h2>
            <p class="text-gray-600 mb-6">Looks like you haven't added any items to your cart yet.</p>
            <a href="#/products" class="btn btn-primary">
              <i class="fa-solid fa-shopping-bag mr-2"></i>
              Start Shopping
            </a>
          </div>
        </div>
      `
      return
    }

    const cartItemsHtml = cartData.items.map(item => `
      <div class="bg-white rounded-lg shadow-sm border p-6 flex items-center gap-4">
        <!-- Product Image -->
        <div class="w-20 h-20 flex-shrink-0">
          <img src="${item.product.image_urls?.[0] || '/images/placeholder.jpg'}" 
               alt="${item.product.name}"
               class="w-full h-full object-cover rounded-lg">
        </div>
        
        <!-- Product Info -->
        <div class="flex-1">
          <h3 class="font-semibold text-gray-800 mb-1">
            <a href="#/products/${item.product.slug}" class="hover:text-secondary">
              ${item.product.name}
            </a>
          </h3>
          <p class="text-sm text-gray-600 mb-2">${item.product.category?.name || 'Uncategorized'}</p>
          <div class="flex items-center gap-4">
            <span class="font-semibold text-secondary">${formatCurrency(item.price_when_added)}</span>
            ${item.price_when_added !== item.product.final_price ? 
              `<span class="text-sm text-gray-500">Current: ${formatCurrency(item.product.final_price)}</span>` : ''
            }
          </div>
        </div>
        
        <!-- Quantity Controls -->
        <div class="flex items-center gap-3">
          <button class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  onclick="updateQuantity('${item.product.id}', ${item.quantity - 1})">
            <i class="fa-solid fa-minus text-xs"></i>
          </button>
          <span class="w-8 text-center font-semibold">${item.quantity}</span>
          <button class="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100"
                  onclick="updateQuantity('${item.product.id}', ${item.quantity + 1})">
            <i class="fa-solid fa-plus text-xs"></i>
          </button>
        </div>
        
        <!-- Total Price -->
        <div class="text-right">
          <div class="font-bold text-lg">${formatCurrency(item.price_when_added * item.quantity)}</div>
          <button class="text-red-500 hover:text-red-700 text-sm mt-1"
                  onclick="removeItem('${item.product.id}')">
            <i class="fa-solid fa-trash mr-1"></i>
            Remove
          </button>
        </div>
      </div>
    `).join('')

    container.innerHTML = `
      <!-- Cart Items -->
      <div class="lg:col-span-2 space-y-4">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-semibold">Cart Items (${cartData.total_items})</h2>
          <button class="text-red-500 hover:text-red-700" onclick="clearCart()">
            <i class="fa-solid fa-trash mr-1"></i>
            Clear Cart
          </button>
        </div>
        ${cartItemsHtml}
      </div>
      
      <!-- Order Summary -->
      <div class="lg:col-span-1">
        <div class="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
          <h2 class="text-xl font-semibold mb-4">Order Summary</h2>
          
          <div class="space-y-3 mb-6">
            <div class="flex justify-between">
              <span>Subtotal (${cartData.total_items} items)</span>
              <span>${formatCurrency(cartData.total_price)}</span>
            </div>
            <div class="flex justify-between">
              <span>Shipping</span>
              <span class="text-green-600">Free</span>
            </div>
            <div class="border-t pt-3">
              <div class="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span class="text-secondary">${formatCurrency(cartData.total_price)}</span>
              </div>
            </div>
          </div>
          
          <button class="btn btn-primary w-full mb-3" onclick="proceedToCheckout()">
            <i class="fa-solid fa-credit-card mr-2"></i>
            Proceed to Checkout
          </button>
          
          <a href="#/products" class="btn btn-outline w-full text-center block">
            <i class="fa-solid fa-arrow-left mr-2"></i>
            Continue Shopping
          </a>
        </div>
      </div>
    `
  }

  // Render error state
  function renderError() {
    const container = page.querySelector('#cart-content')
    container.innerHTML = `
      <div class="lg:col-span-3 text-center py-12">
        <div class="max-w-md mx-auto">
          <i class="fa-solid fa-exclamation-triangle text-6xl text-red-300 mb-4"></i>
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Failed to load cart</h2>
          <p class="text-gray-600 mb-6">There was an error loading your cart. Please try again.</p>
          <button class="btn btn-primary" onclick="location.reload()">
            <i class="fa-solid fa-refresh mr-2"></i>
            Retry
          </button>
        </div>
      </div>
    `
  }

  // Global functions for cart interactions
  window.updateQuantity = async function(productId, newQuantity) {
    try {
      if (window.cart) {
        await window.cart.updateQuantity(productId, newQuantity)
      } else {
        await cartService.updateCartItem(productId, newQuantity)
      }
      await loadCart() // Refresh cart
    } catch (error) {
      console.error('Failed to update quantity:', error)
      showToast('Failed to update quantity', 'error')
    }
  }

  window.removeItem = async function(productId) {
    try {
      if (window.cart) {
        await window.cart.removeItem(productId)
      } else {
        await cartService.removeFromCart(productId)
      }
      await loadCart() // Refresh cart
    } catch (error) {
      console.error('Failed to remove item:', error)
      showToast('Failed to remove item', 'error')
    }
  }

  window.clearCart = async function() {
    if (confirm('Are you sure you want to clear your cart?')) {
      try {
        if (window.cart) {
          await window.cart.clearCart()
        } else {
          await cartService.clearCart()
        }
        await loadCart() // Refresh cart
      } catch (error) {
        console.error('Failed to clear cart:', error)
        showToast('Failed to clear cart', 'error')
      }
    }
  }

  window.proceedToCheckout = function() {
    // TODO: Implement checkout functionality
    showToast('Checkout functionality coming soon!', 'info')
  }

  // Initialize
  loadCart()
}
