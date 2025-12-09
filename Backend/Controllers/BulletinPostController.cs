using Backend.DTOs;
using Backend.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BulletinPostController : ControllerBase
    {
        private readonly IBulletinPostService _service;
        private readonly ILogger<BulletinPostController> _logger;

        public BulletinPostController(IBulletinPostService service, ILogger<BulletinPostController> logger)
        {
            _service = service;
            _logger = logger;
        }

        /// <summary>
        /// Get all posts
        /// </summary>
        [HttpGet]
        public async Task<ActionResult<IEnumerable<BulletinPostDto>>> GetAll()
        {
            try
            {
                var posts = await _service.GetAllPostsAsync();
                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting all bulletin posts");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get post by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<ActionResult<BulletinPostDto>> GetById(string id)
        {
            try
            {
                var post = await _service.GetPostByIdAsync(id);
                if (post == null)
                    return NotFound($"Post with ID {id} not found");

                return Ok(post);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting bulletin post {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get posts by category
        /// </summary>
        [HttpGet("category/{category}")]
        public async Task<ActionResult<IEnumerable<BulletinPostDto>>> GetByCategory(string category)
        {
            try
            {
                var posts = await _service.GetPostsByCategoryAsync(category);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting posts by category {Category}", category);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get posts by city
        /// </summary>
        [HttpGet("city/{city}")]
        public async Task<ActionResult<IEnumerable<BulletinPostDto>>> GetByCity(string city)
        {
            try
            {
                var posts = await _service.GetPostsByCityAsync(city);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting posts by city {City}", city);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Get posts by status
        /// </summary>
        [HttpGet("status/{status}")]
        public async Task<ActionResult<IEnumerable<BulletinPostDto>>> GetByStatus(string status)
        {
            try
            {
                var posts = await _service.GetPostsByStatusAsync(status);
                return Ok(posts);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting posts by status {Status}", status);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Search posts with filters
        /// Can filter by: category, subcategory, price range, city, area, status, free text and date range
        /// </summary>
        [HttpPost("search")]
        public async Task<ActionResult<IEnumerable<BulletinPostDto>>> Search([FromBody] BulletinPostFilterDto filter)
        {
            try
            {
                var posts = await _service.SearchPostsAsync(filter);
                return Ok(posts);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error searching bulletin posts");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Create new post with image upload
        /// </summary>
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<BulletinPostDto>> Create([FromForm] CreateBulletinPostDto dto, [FromForm] IFormFile? image)
        {
            try
            {
                if (!ModelState.IsValid)
                    return BadRequest(ModelState);

                // Get logged-in user
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                             User.FindFirst("userId")?.Value;

                _logger.LogInformation("Creating post with userId: {UserId}, Claims: {Claims}", 
                    userId, string.Join(", ", User.Claims.Select(c => $"{c.Type}={c.Value}")));

                // Save image if exists
                string? imageUrl = null;
                if (image != null && image.Length > 0)
                {
                    imageUrl = await SaveImageAsync(image);
                }

                var created = await _service.CreatePostAsync(dto, imageUrl, userId);
                return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating bulletin post");
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Update existing post with image upload
        /// </summary>
        [HttpPut("{id}")]
        [Consumes("multipart/form-data")]
        public async Task<ActionResult<BulletinPostDto>> Update(string id, [FromForm] UpdateBulletinPostDto dto, [FromForm] IFormFile? image)
        {
            try
            {
                // Check that logged-in user owns the post
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                             User.FindFirst("userId")?.Value;
                var existingPost = await _service.GetPostByIdAsync(id);
                
                if (existingPost == null)
                    return NotFound($"Post with ID {id} not found");

                if (!string.IsNullOrEmpty(userId) && existingPost.CreatedBy != userId)
                    return Forbid("You can only edit your own posts");

                // Save image if exists
                string? imageUrl = null;
                if (image != null && image.Length > 0)
                {
                    imageUrl = await SaveImageAsync(image);
                }

                var updated = await _service.UpdatePostAsync(id, dto, imageUrl);
                if (updated == null)
                    return NotFound($"Post with ID {id} not found");

                return Ok(updated);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating bulletin post {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Delete post
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<ActionResult> Delete(string id)
        {
            try
            {
                // Check that logged-in user owns the post
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? 
                             User.FindFirst("userId")?.Value;
                var existingPost = await _service.GetPostByIdAsync(id);
                
                if (existingPost == null)
                    return NotFound($"Post with ID {id} not found");

                if (!string.IsNullOrEmpty(userId) && existingPost.CreatedBy != userId)
                    return Forbid("You can only delete your own posts");

                var result = await _service.DeletePostAsync(id);
                if (!result)
                    return NotFound($"Post with ID {id} not found");

                return NoContent();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting bulletin post {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Change post status
        /// </summary>
        [HttpPatch("{id}/status")]
        public async Task<ActionResult> ChangeStatus(string id, [FromBody] string status)
        {
            try
            {
                var result = await _service.ChangePostStatusAsync(id, status);
                if (!result)
                    return NotFound($"Post with ID {id} not found");

                return Ok(new { message = $"Status changed to {status}" });
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error changing status of bulletin post {Id}", id);
                return StatusCode(500, "Internal server error");
            }
        }

        /// <summary>
        /// Save image on server
        /// </summary>
        private async Task<string> SaveImageAsync(IFormFile image)
        {
            // Create directory for saving images
            var uploadsFolder = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads");
            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            // Create unique filename
            var fileName = $"{Guid.NewGuid()}{Path.GetExtension(image.FileName)}";
            var filePath = Path.Combine(uploadsFolder, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await image.CopyToAsync(stream);
            }

            // Return relative URL
            return $"/uploads/{fileName}";
        }
    }
}
