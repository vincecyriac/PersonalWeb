import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    document.getElementById('HOME-BTN').style.color="#e9204f";
  }
  ngOnDestroy(){
    document.getElementById('HOME-BTN').style.color="rgb(141, 141, 141)";
  }

}
