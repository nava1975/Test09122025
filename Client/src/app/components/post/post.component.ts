import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { BulletinPost } from 'src/app/models/bulletin-post.model';

@Component({
  selector: 'app-post',
  templateUrl: './post.component.html',
  styleUrls: ['./post.component.css']
})
export class PostComponent implements OnInit {
  @Input() post!: BulletinPost;
  @Input() canEdit: boolean = false;
  @Input() apiUrl: string = '';
  
  @Output() edit = new EventEmitter<BulletinPost>();
  @Output() delete = new EventEmitter<string>();
  
  ngOnInit(): void {

    console.log('PostComponent - Post loaded:', this.apiUrl + this.post.profileImageUrl);
    }
  
  onEdit(): void {
    this.edit.emit(this.post);
  }

  onDelete(): void {
    this.delete.emit(this.post.id);
  }
}
