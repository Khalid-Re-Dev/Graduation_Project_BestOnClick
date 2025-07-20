import { createElementFromHTML, showToast, formatCurrency } from "../utils/helpers.js?v=2024"
import { productService } from "../services/api.js"
import { ProductCard } from "../components/ProductCard.js"
import { SkeletonProductDetail, SkeletonCards } from "../components/LoadingSpinner.js"
import store from "../state/store.js"

export default function ProductDetailPage(params) {
  const page = createElementFromHTML(`
        <div class="min-h-screen bg-gray-50">
            <!-- Breadcrumb -->
            <div class="bg-white border-b">
                <div class="container mx-auto py-4 px-4">
                    <nav class="flex items-center space-x-2 text-sm">
                        <a href="#/" class="text-secondary hover:text-primary transition-colors">
                            <i class="fa-solid fa-home mr-1"></i>
                            Home
                        </a>
                        <i class="fa-solid fa-chevron-right text-gray-400"></i>
                        <a href="#/products" class="text-secondary hover:text-primary transition-colors">Products</a>
                        <i class="fa-solid fa-chevron-right text-gray-400"></i>
                        <span class="text-gray-600" id="breadcrumb-product">Loading...</span>
                    </nav>
                </div>
            </div>

            <!-- Main Content -->
            <div class="container mx-auto py-8 px-4">
                <div id="product-content">
                    <!-- Loading skeleton will be inserted here -->
                </div>
            </div>
        </div>
    `)

  // Show loading skeleton
  const productContent = page.querySelector('#product-content')
  productContent.appendChild(SkeletonProductDetail())

  // Load product details
  loadProductDetails(page, params.id)

  return page
}

async function loadProductDetails(page, productId) {
  try {
    const product = await productService.getProductById(productId)
    renderProductDetails(page, product)
    loadSimilarProducts(page, productId)
  } catch (error) {
    page.querySelector('#product-content').innerHTML = `
      <div class="text-center">
        <h1 class="text-2xl font-bold text-danger mb-4">Product Not Found</h1>
        <p class="text-muted mb-4">The product you're looking for doesn't exist.</p>
        <a href="#/products" class="btn btn-primary">Browse All Products</a>
      </div>
    `
  }
}

function renderProductDetails(page, product) {
  // Handle backend data structure
  const finalPrice = product.final_price || product.price
  const originalPrice = product.price
  const hasDiscount = (product.discount_percentage || 0) > 0
  const categoryName = product.category?.name || product.category || 'Uncategorized'
  const rating = product.average_rating || product.rating || 0
  const reviewsCount = product.total_reviews || product.reviews_count || 0
  const isInStock = product.in_stock !== undefined ? product.in_stock : (product.stock || 0) > 0

  // Get images - handle both image_urls array and images objects
  let imageUrls = []
  if (product.image_urls && product.image_urls.length > 0) {
    imageUrls = product.image_urls
  } else if (product.images && product.images.length > 0) {
    imageUrls = product.images.map(img => img.image || img.url || img)
  }

  // Update breadcrumb
  const breadcrumbProduct = page.querySelector('#breadcrumb-product')
  if (breadcrumbProduct) {
    breadcrumbProduct.textContent = product.name
  }

  const content = `

    <!-- Product Details Card -->
    <div class="bg-white rounded-lg shadow-sm border overflow-hidden mb-8">
      <div class="grid grid-cols-1 lg:grid-cols-2">
        <!-- Product Images -->
        <div class="p-8">
          <div class="space-y-4">
            <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden relative group">
              <img src="${imageUrls[0] || 'https://via.placeholder.com/500x500/f3f4f6/9ca3af?text=' + encodeURIComponent(product.name)}"
                   alt="${product.name}"
                   class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                   id="main-image"
                   onerror="this.src='https://via.placeholder.com/500x500/f3f4f6/9ca3af?text=' + encodeURIComponent('${product.name}'); this.onerror=null;">
              <div class="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-5 transition-all duration-300"></div>
            </div>
            ${imageUrls.length > 1 ? `
              <div class="grid grid-cols-4 gap-3">
                ${imageUrls.slice(0, 4).map((url, index) => `
                  <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer hover:ring-2 hover:ring-secondary transition-all">
                    <img src="${url}"
                         alt="${product.name} ${index + 1}"
                         class="w-full h-full object-cover"
                         onclick="changeMainImage('${url}', this)"
                         onerror="this.src='https://via.placeholder.com/150x150/f3f4f6/9ca3af?text=' + encodeURIComponent('${product.name}'); this.onerror=null;">
                  </div>
                `).join('')}
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Product Info -->
        <div class="p-8 space-y-6">
          <!-- Header -->
          <div>
            <div class="flex items-center gap-2 mb-2">
              <span class="px-3 py-1 bg-secondary bg-opacity-10 text-secondary text-sm font-medium rounded-full">
                ${categoryName}
              </span>
              ${isInStock ?
                '<span class="px-3 py-1 bg-success bg-opacity-10 text-success text-sm font-medium rounded-full">In Stock</span>' :
                '<span class="px-3 py-1 bg-danger bg-opacity-10 text-danger text-sm font-medium rounded-full">Out of Stock</span>'
              }
            </div>
            <h1 class="text-3xl lg:text-4xl font-bold text-primary mb-4">${product.name}</h1>
          </div>

          <!-- Rating -->
          ${rating > 0 ? `
            <div class="flex items-center gap-3">
              <div class="flex text-yellow-400">
                ${Array.from({length: 5}, (_, i) => `
                  <i class="fa-solid fa-star ${i < Math.floor(rating) ? '' : 'text-gray-300'}"></i>
                `).join('')}
              </div>
              <span class="text-gray-600 font-medium">${rating.toFixed(1)}</span>
              <span class="text-gray-400">•</span>
              <span class="text-gray-600">${reviewsCount} reviews</span>
            </div>
          ` : ''}

          <!-- Price -->
          <div class="flex items-center gap-4">
            <div class="text-4xl font-bold text-secondary">${formatCurrency(finalPrice)}</div>
            ${hasDiscount ? `
              <div class="flex flex-col">
                <div class="text-lg text-gray-500 line-through">${formatCurrency(originalPrice)}</div>
                <div class="text-sm text-success font-medium">Save ${Math.round(product.discount_percentage)}%</div>
              </div>
            ` : ''}
          </div>

          <!-- Description -->
          ${product.description ? `
            <div>
              <h3 class="font-semibold text-lg mb-3 text-gray-800">Description</h3>
              <p class="text-gray-600 leading-relaxed">${product.description}</p>
            </div>
          ` : ''}

          <!-- Quantity and Actions -->
          <div class="space-y-4 pt-4">
            <!-- Quantity Selector -->
            <div class="flex items-center gap-4">
              <span class="text-gray-700 font-medium">Quantity:</span>
              <div class="flex items-center border border-gray-300 rounded-lg">
                <button class="px-4 py-2 hover:bg-gray-100 transition-colors" onclick="changeQuantity(-1)">
                  <i class="fa-solid fa-minus"></i>
                </button>
                <span class="px-6 py-2 border-x border-gray-300 font-medium" id="quantity">1</span>
                <button class="px-4 py-2 hover:bg-gray-100 transition-colors" onclick="changeQuantity(1)">
                  <i class="fa-solid fa-plus"></i>
                </button>
              </div>
            </div>

            <!-- Main Action Button -->
            <button class="btn btn-primary w-full text-lg py-4" onclick="addToCart('${product.slug || product.id}')" ${!isInStock ? 'disabled' : ''}>
              <i class="fa-solid fa-shopping-cart mr-3"></i>
              ${isInStock ? 'Add to Cart' : 'Out of Stock'}
            </button>

            <!-- Secondary Actions -->
            <div class="grid grid-cols-2 gap-3">
              <button class="btn btn-outline" onclick="addToWishlist(${product.id})">
                <i class="fa-solid fa-heart mr-2"></i>
                Wishlist
              </button>
              <button class="btn btn-outline" onclick="shareProduct()">
                <i class="fa-solid fa-share mr-2"></i>
                Share
              </button>
            </div>
          </div>

          <!-- Product Details -->
          <div class="border-t pt-6">
            <h4 class="font-semibold text-gray-800 mb-4">Product Details</h4>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">SKU:</span>
                <span class="font-medium">PRD-${product.id.toString().padStart(6, '0')}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Stock:</span>
                <span class="font-medium">${product.stock || 0} units</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Category:</span>
                <a href="#/products?category=${product.category}" class="text-secondary hover:text-primary transition-colors font-medium">${product.category}</a>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">Brand:</span>
                <span class="font-medium">${product.brand || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Similar Products -->
    <div class="bg-white rounded-lg shadow-sm border p-8">
      <div class="flex items-center justify-between mb-8">
        <div>
          <h2 class="text-2xl font-bold text-primary flex items-center gap-2">
            <i class="fa-solid fa-robot text-purple-500"></i>
            You Might Also Like
          </h2>
          <p class="text-sm text-gray-600 mt-1">AI-powered recommendations based on this product</p>
        </div>
        <a href="#/products" class="text-secondary hover:text-primary transition-colors font-medium">
          View All Products
          <i class="fa-solid fa-arrow-right ml-2"></i>
        </a>
      </div>
      <div id="similar-products" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
        <div class="col-span-full flex justify-center py-12">
          <div class="text-center">
            <div class="loader w-12 h-12 border-4 border-gray-200 border-t-secondary rounded-full animate-spin mx-auto mb-4"></div>
            <p class="text-gray-500">Loading AI recommendations...</p>
          </div>
        </div>
      </div>
    </div>
  `

  page.querySelector('#product-content').innerHTML = content

  // Add global functions for interactions
  window.changeMainImage = function(url, element) {
    document.getElementById('main-image').src = url
    // Update border styles
    document.querySelectorAll('.aspect-square + div img').forEach(img => {
      img.classList.remove('border-secondary')
      img.classList.add('border-gray-200')
    })
    element.classList.remove('border-gray-200')
    element.classList.add('border-secondary')
  }

  window.changeQuantity = function(delta) {
    const quantityEl = document.getElementById('quantity')
    let quantity = parseInt(quantityEl.textContent) + delta
    if (quantity < 1) quantity = 1
    if (quantity > product.stock) quantity = product.stock
    quantityEl.textContent = quantity
  }

  window.addToCart = function(productId) {
    const quantity = parseInt(document.getElementById('quantity').textContent)
    // Here you would add to cart logic
    showToast(`Added ${quantity} item(s) to cart!`, "success")
  }

  window.addToWishlist = function(productId) {
    // Here you would add to wishlist logic
    showToast("Added to wishlist!", "success")
  }

  window.shareProduct = function() {
    if (navigator.share) {
      navigator.share({
        title: product.name,
        text: product.description,
        url: window.location.href
      })
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href)
      showToast("Product link copied to clipboard!", "success")
    }
  }
}

async function loadSimilarProducts(page, productId) {
  const container = page.querySelector('#similar-products')
  const startTime = performance.now()

  // Show loading skeleton
  container.innerHTML = ''
  container.appendChild(SkeletonCards(4))

  try {
    const data = await productService.getSimilarProducts(productId)
    console.log('Similar products response:', data) // Debug log

    // Extract similar products from the response
    const similarProducts = data.similar_products || data.results || data

    // Performance tracking
    const loadTime = performance.now() - startTime
    console.log(`Similar products loaded in ${loadTime.toFixed(2)}ms`)

    // Clear loading skeleton
    container.innerHTML = ''

    if (!similarProducts || similarProducts.length === 0) {
      container.innerHTML = `
        <div class="col-span-full text-center py-8">
          <div class="text-4xl text-muted mb-4">
            <i class="fa-solid fa-search"></i>
          </div>
          <p class="text-muted">No similar products found.</p>
        </div>
      `
    } else {
      // Create optimized similar product cards
      container.innerHTML = similarProducts.slice(0, 4).map(createSimilarProductCard).join('')

      // Track recommendation display
      trackRecommendationDisplay(productId, similarProducts.slice(0, 4))
    }
  } catch (error) {
    console.error('Error loading similar products:', error)
    container.innerHTML = `
      <div class="col-span-full text-center py-8">
        <div class="text-4xl text-danger mb-4">
          <i class="fa-solid fa-exclamation-triangle"></i>
        </div>
        <h3 class="text-lg font-semibold text-danger mb-2">Could not load recommendations</h3>
        <p class="text-gray-600 mb-4">Our AI recommendation engine is temporarily unavailable.</p>
        <div class="flex gap-3 justify-center">
          <button class="btn btn-outline" onclick="loadSimilarProducts(document.querySelector('#product-detail'), '${productId}')">
            <i class="fa-solid fa-refresh mr-2"></i>
            Try Again
          </button>
          <a href="#/products" class="btn btn-secondary">
            <i class="fa-solid fa-search mr-2"></i>
            Browse Products
          </a>
        </div>
      </div>
    `
  }
}

// Create optimized similar product card
function createSimilarProductCard(similarProduct) {
  const imageUrl = `https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=${encodeURIComponent(similarProduct.name)}`
  const formattedPrice = formatCurrency(similarProduct.price)
  const rating = Math.round(similarProduct.rating * 10) / 10
  const stars = generateStarRating(rating)

  return `
    <div class="bg-white rounded-lg shadow-sm border hover:shadow-lg transition-all duration-300 group cursor-pointer overflow-hidden" onclick="loadSimilarProductDetails(${similarProduct.product_id})">
      <!-- Product Image -->
      <div class="relative overflow-hidden">
        <img src="${imageUrl}"
             alt="${similarProduct.name}"
             class="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-300"
             onerror="this.src='https://via.placeholder.com/300x300/f3f4f6/9ca3af?text=' + encodeURIComponent('${similarProduct.name}'); this.onerror=null;">

        <!-- AI Recommendation Badge -->
        <div class="absolute top-3 left-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-2 py-1 rounded-full text-xs font-bold">
          <i class="fa-solid fa-robot mr-1"></i>
          AI Pick
        </div>

        <!-- Similarity Score -->
        <div class="absolute top-3 right-3 bg-black bg-opacity-70 text-white px-2 py-1 rounded-full text-xs">
          ${Math.round(similarProduct.score * 100)}% Match
        </div>

        <!-- Action Buttons -->
        <div class="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button class="bg-white p-3 rounded-full shadow-md hover:bg-secondary hover:text-white transition-colors"
                  onclick="addToWishlist(${similarProduct.product_id}, event)"
                  title="Add to Wishlist">
            <i class="fa-solid fa-heart"></i>
          </button>
          <button class="bg-white p-3 rounded-full shadow-md hover:bg-secondary hover:text-white transition-colors"
                  onclick="quickAddToCart(${similarProduct.product_id}, event)"
                  title="Quick Add to Cart">
            <i class="fa-solid fa-shopping-cart"></i>
          </button>
        </div>
      </div>

      <!-- Product Info -->
      <div class="p-4">
        <h3 class="font-semibold text-gray-800 mb-2 line-clamp-2 group-hover:text-secondary transition-colors">
          ${similarProduct.name}
        </h3>

        <!-- Rating -->
        <div class="flex items-center gap-2 mb-3">
          <div class="flex text-yellow-400 text-sm">
            ${stars}
          </div>
          <span class="text-xs text-gray-500">(${rating})</span>
        </div>

        <!-- Price -->
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <span class="text-lg font-bold text-secondary">${formattedPrice}</span>
          </div>
          <div class="text-xs text-gray-500">
            ${similarProduct.algorithm === 'content_similarity' ? 'Similar' : 'Recommended'}
          </div>
        </div>

        <!-- Recommendation Reason -->
        <div class="mt-2 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
          <i class="fa-solid fa-lightbulb mr-1"></i>
          ${similarProduct.reason}
        </div>
      </div>
    </div>
  `
}

// Generate star rating HTML
function generateStarRating(rating) {
  const fullStars = Math.floor(rating)
  const hasHalfStar = rating % 1 >= 0.5
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0)

  let stars = ''
  for (let i = 0; i < fullStars; i++) {
    stars += '<i class="fa-solid fa-star"></i>'
  }
  if (hasHalfStar) {
    stars += '<i class="fa-solid fa-star-half-alt"></i>'
  }
  for (let i = 0; i < emptyStars; i++) {
    stars += '<i class="fa-regular fa-star"></i>'
  }
  return stars
}

// Load similar product details
window.loadSimilarProductDetails = async function(productId) {
  try {
    // Show loading state
    showToast("Loading product details...", "info")

    // Get all products to find the one with this ID
    const productsData = await productService.getProducts()
    const product = productsData.results.find(p => p.id === productId)

    if (product) {
      location.hash = `/products/${product.slug}`
    } else {
      showToast("Product not found", "error")
    }
  } catch (error) {
    console.error('Error loading similar product:', error)
    showToast("Error loading product", "error")
  }
}

// Quick add to wishlist
window.addToWishlist = function(productId, event) {
  if (event) event.stopPropagation()
  showToast("Added to wishlist!", "success")
  // TODO: Implement actual wishlist functionality
}

// Quick add to cart
window.quickAddToCart = function(productId, event) {
  if (event) event.stopPropagation()
  showToast("Added to cart!", "success")
  // TODO: Implement actual cart functionality
}

// Track recommendation display for analytics
function trackRecommendationDisplay(sourceProductId, recommendations) {
  try {
    const trackingData = {
      source_product_id: sourceProductId,
      recommendations: recommendations.map(rec => ({
        product_id: rec.product_id,
        score: rec.score,
        algorithm: rec.algorithm,
        position: recommendations.indexOf(rec) + 1
      })),
      timestamp: new Date().toISOString(),
      session_id: generateSessionId()
    }

    console.log('Recommendation display tracked:', trackingData)
    // TODO: Send to analytics service
    // analyticsService.trackRecommendationDisplay(trackingData)
  } catch (error) {
    console.error('Error tracking recommendation display:', error)
  }
}

// Generate session ID for tracking
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substring(2, 11)
}

// Utility functions for product detail interactions
window.changeQuantity = function(delta) {
  const quantityElement = document.querySelector('#quantity')
  if (quantityElement) {
    let currentQuantity = parseInt(quantityElement.textContent)
    currentQuantity = Math.max(1, currentQuantity + delta)
    quantityElement.textContent = currentQuantity
  }
}

window.addToCart = async function(productSlug) {
  try {
    const quantityElement = document.querySelector('#quantity')
    const quantity = quantityElement ? parseInt(quantityElement.textContent) : 1

    if (window.cart) {
      await window.cart.addToCart(productSlug, quantity)
    } else {
      // Fallback to direct API call
      const { cartService } = await import('../services/api.js')
      await cartService.addToCart(productSlug, quantity)
      showToast(`Added ${quantity} item(s) to cart!`, 'success')
    }
  } catch (error) {
    console.error('Failed to add to cart:', error)
    showToast('Failed to add to cart', 'error')
  }
}

window.addToWishlist = async function(productSlug) {
  try {
    const { cartService } = await import('../services/api.js')
    await cartService.saveItem(productSlug)
    showToast('Added to wishlist!', 'success')
  } catch (error) {
    console.error('Failed to add to wishlist:', error)
    showToast('Failed to add to wishlist', 'error')
  }
}

window.shareProduct = function() {
  if (navigator.share) {
    navigator.share({
      title: document.title,
      url: window.location.href
    })
  } else {
    navigator.clipboard.writeText(window.location.href)
    showToast('Product link copied to clipboard!', 'success')
  }
}

window.changeMainImage = function(newSrc, thumbnail) {
  const mainImage = document.querySelector('#main-image')
  if (mainImage) {
    mainImage.src = newSrc

    // Update thumbnail borders
    document.querySelectorAll('.thumbnail-image').forEach(img => {
      img.classList.remove('border-secondary')
      img.classList.add('border-gray-200')
    })

    if (thumbnail) {
      thumbnail.classList.remove('border-gray-200')
      thumbnail.classList.add('border-secondary')
    }
  }
}
