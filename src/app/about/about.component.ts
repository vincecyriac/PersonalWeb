import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    document.getElementById('ABT-BTN').style.color="#e9204f";
  }
  ngOnDestroy(){
    document.getElementById('ABT-BTN').style.color="rgb(141, 141, 141)";
  }

}
