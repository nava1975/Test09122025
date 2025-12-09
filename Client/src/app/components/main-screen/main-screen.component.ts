import { Component, ViewChild } from '@angular/core';
import { PostsBoardComponent } from '../posts-board/posts-board.component';
import { BulletinPost } from 'src/app/models/bulletin-post.model';

@Component({
  selector: 'app-main-screen',
  templateUrl: './main-screen.component.html',
  styleUrls: ['./main-screen.component.css']
})
export class MainScreenComponent {
  @ViewChild(PostsBoardComponent) postsBoard!: PostsBoardComponent;

  onSearchResults(results: BulletinPost[]): void {
    if (this.postsBoard) {
      this.postsBoard.onSearchResults(results);
    }
  }

  onClearFilter(): void {
    if (this.postsBoard) {
      this.postsBoard.onClearFilter();
    }
}
}
