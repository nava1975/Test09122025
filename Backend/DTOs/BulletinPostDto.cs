using Backend.Models;

namespace Backend.DTOs
{
    public class BulletinPostDto
    {
        public string Id { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string SubCategory { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public string ImageUrl { get; set; } = string.Empty;
        public LocationInfoDto Location { get; set; } = new LocationInfoDto();
        public string OwnerName { get; set; } = string.Empty;
        public string Phone1 { get; set; } = string.Empty;
        public string? Phone2 { get; set; }
        public string? Description { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string CreatedBy { get; set; } = string.Empty;
        public string? ProfileImageUrl { get; set; }
    }

    public class LocationInfoDto
    {
        public string City { get; set; } = string.Empty;
        public string? Area { get; set; }
        public string? Street { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
    }

    public class CreateBulletinPostDto
    {
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string? SubCategory { get; set; }
        public decimal Price { get; set; }
        public string OwnerName { get; set; } = string.Empty;
        public string Phone1 { get; set; } = string.Empty;
        public string? Phone2 { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        
        // Location fields flattened for FormData compatibility
        public string LocationCity { get; set; } = string.Empty;
        public string? LocationArea { get; set; }
        public string? LocationStreet { get; set; }
        public double? LocationLatitude { get; set; }
        public double? LocationLongitude { get; set; }
    }

    public class UpdateBulletinPostDto
    {
        public string? Title { get; set; }
        public string? Category { get; set; }
        public string? SubCategory { get; set; }
        public decimal? Price { get; set; }
        public string? OwnerName { get; set; }
        public string? Phone1 { get; set; }
        public string? Phone2 { get; set; }
        public string? Description { get; set; }
        public string? Status { get; set; }
        
        // Location fields flattened for FormData compatibility
        public string? LocationCity { get; set; }
        public string? LocationArea { get; set; }
        public string? LocationStreet { get; set; }
        public double? LocationLatitude { get; set; }
        public double? LocationLongitude { get; set; }
    }

    public class BulletinPostFilterDto
    {
        public string? SearchText { get; set; }
        public string? Category { get; set; }
        public string? SubCategory { get; set; }
        public decimal? MinPrice { get; set; }
        public decimal? MaxPrice { get; set; }
        public string? City { get; set; }
        public string? Area { get; set; }
        public string? Address { get; set; }
        public string? Status { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        public double? Latitude { get; set; }
        public double? Longitude { get; set; }
        public double? RadiusKm { get; set; }
    }
}
