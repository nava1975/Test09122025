namespace Backend.Models
{
    public class BulletinPost
    {
        public string Id { get; set; } = Guid.NewGuid().ToString();
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string SubCategory { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = string.Empty;      
        public LocationInfo Location { get; set; } = new LocationInfo();
        public string OwnerName { get; set; } = string.Empty;
        public string Phone1 { get; set; } = string.Empty;
        public string? Phone2 { get; set; }
        public string? Description { get; set; }
        public PostStatus Status { get; set; } = PostStatus.Active;
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        public string CreatedBy { get; set; } = string.Empty; // User ID who created this post   
        public string? ProfileImageUrl { get; set; }
   
    }

    public class LocationInfo
    {
        public string City { get; set; } = string.Empty;
        public string? Area { get; set; }
        public string? Street { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }

    public enum PostStatus
    {
        Active,       // Active
        Sold,         // Sold / Closed
        Archived      // Archived
    }
}
