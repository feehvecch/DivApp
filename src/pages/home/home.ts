import { Component, ElementRef, ViewChild, NgZone } from '@angular/core';
import { NavController, NavParams,Platform, ViewController, AlertController } from 'ionic-angular';
import { Geolocation } from '@ionic-native/geolocation';
import { GoogleMaps } from '../../providers/google-maps/google-maps';

@Component({
  selector: 'page-home',
  templateUrl: 'home.html'
})
export class HomePage {

  @ViewChild('map') mapElement: ElementRef;
  @ViewChild('pleaseConnect') pleaseConnect: ElementRef;

  latitude: number;
  longitude: number;
  autocompleteService: any;
  placesService: any;
  query: string = '';
  places: any = [];
  searchDisabled: boolean;
  saveDisabled: boolean;
  location: any;
  map:any;

  constructor(public navCtrl: NavController, public navParams: NavParams, public zone: NgZone, public maps: GoogleMaps,
    public platform: Platform, public geolocation: Geolocation, public viewCtrl: ViewController, public alertCtrl: AlertController) {
      this.searchDisabled = true;
      this.saveDisabled = true;

  }

  ionViewDidLoad(): void {
    this.maps.init(this.mapElement.nativeElement, this.pleaseConnect.nativeElement).then(() => {
        this.autocompleteService = new google.maps.places.AutocompleteService();
        this.placesService = new google.maps.places.PlacesService(this.maps.map);

        this.searchDisabled = false;

    });


    var tips = new Array ();
    tips[0] = "Tome bastante líquido para manter os fios hidratados!";
    tips[1] = "Antes de fazer escova ou chapinha, use cremes e silicones antitérmicos para proteger os fios!";
    tips[2] = "Corte as pontas do cabelo a cada três meses!";
    tips[3] = "Proteja os cabelos do sol. Use chapéu e hidratantes com protetores solares!";
    tips[4] = "Ao lavar os cabelos, evite a água quente, que abre a cutícula dos fios e provoca ressecamento!";
    tips[5] = "Uma vez por semana, use shampoo anti-resíduos para fazer uma limpeza profunda.";
    tips[6] = "Para não quebrar os fios, evite dormir com os cabelos molhados.";
    tips[7] = "Cabelos oleosos: lave diariamente para retirar o excesso de sebo e evitar a queda.";
    tips[8] = "Para fortalecer e hidratar os fios, passe babosa. Deixe-a agir por 30 minutos. Lave normalmente.";
    tips[9] = "Máscara para dar brilho: Bata no liquidificador uma maçã sem sementes e 1/2 copo de água. Após a lavagem dos fios, passe nos cabelos, massageando o couro cabeludo. Deixe agir por 30 minutos e enxágue em seguida."
    var i = Math.floor(9*Math.random())
      let alert = this.alertCtrl.create({
        title: 'Dica de Beleza!',
        subTitle: tips[i],
        buttons: ['OK']
      });
      alert.present();

  }

  selectPlace(place){
      this.places = [];
      let location = {
          lat: null,
          lng: null,
          name: place.name,
          open: place.open_now,
          phone: place.formatted_phone_number,
          end: place.formatted_address
      };
      let infowindow = new google.maps.InfoWindow({maxWidth: 200});
      this.placesService.getDetails({placeId: place.place_id}, (details) => {
          this.zone.run(() => {
              location.name = details.name;
              location.lat = details.geometry.location.lat();
              location.lng = details.geometry.location.lng();
              this.saveDisabled = false;
              this.maps.map.setCenter({lat: location.lat, lng: location.lng});
              this.location = location;
          });
          var marker = new google.maps.Marker({
            map: this.maps.map,
            position: this.location,
            title: place.name,
            icon: {url: '../../../assets/icon/dv.png'}
          });

          var infowindow = new google.maps.InfoWindow();
           marker.addListener('click', function() {
             if (details) {
                 if (details.hasOwnProperty('opening_hours')) {
                   this.isOpenBool = details.opening_hours.open_now;
                 } else {
                   this.isOpenBool = false;
                 }

                 if (this.isOpenBool) {
                   this.isOpenString = '<span style="color:green;font-weight:bold;">Aberto</span>';
                 } else {
                   this.isOpenString = '<span style="color:red;font-weight:bold;">Fechado</span>';
                 }
                 this.detailLocation =  details.formatted_phone_number + ' | ' + this.isOpenString + '<br/>' + details.formatted_address;
                 }else{
                     if (place.hasOwnProperty('opening_hours')) {
                     this.isOpenBool = place.opening_hours.open_now;
                   } else {
                     this.isOpenBool = false;
                     this.isOpenUnknown = true;
                   }

                   if (this.isOpenBool) {
                     this.isOpenString = '<span style="color:green;font-weight:bold;">Aberto</span>';
                   } else {
                     if (this.isOpenUnknown) {
                       this.isOpenString = '<span style="color:blue;font-weight:bold;">Sem Informação</span>';
                     } else {
                       this.isOpenString = '<span style="color:red;font-weight:bold;">Fechado</span>';
                     }
                   }
                   this.detailLocation = place.vicinity + '<br/>' + this.isOpenString;
                 }
             infowindow.setContent("<strong>" + location.name + "</strong>" + '<br/>' + this.detailLocation);
             infowindow.open(this.maps, marker);
           });
      });
  }

    searchPlace(){
      this.saveDisabled = true;
      if(this.query.length > 0 && !this.searchDisabled) {
          let config = {
            types: ['establishment'],
            input: this.query,
            location: this.location,
            country: 'br'
          }
          this.autocompleteService.getPlacePredictions(config, (predictions, status) => {
            if(status == google.maps.places.PlacesServiceStatus.OK && predictions){
              this.places = [];
              predictions.forEach((prediction) => {
                this.places.push(prediction);
              });
            }
          });
      } else {
        this.places = [];
      }
    }


}
