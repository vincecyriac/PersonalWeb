import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
    document.getElementById('CNTCT-BTN').style.color="#e9204f";
  }
  ngOnDestroy(){
    document.getElementById('CNTCT-BTN').style.color="rgb(141, 141, 141)";
  }

}
