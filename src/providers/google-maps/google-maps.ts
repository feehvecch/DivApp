import { Injectable } from '@angular/core';
import { Connectivity } from '../connectivity-service/connectivity-service';
import { Geolocation } from '@ionic-native/geolocation';
import 'rxjs/add/operator/map';

@Injectable()
export class GoogleMaps {

  mapElement: any;
  pleaseConnect: any;
  map: any;
  mapInitialised: boolean = false;
  mapLoaded: any;
  mapLoadedObserver: any;
  markers: any;
  apiKey: string = "AIzaSyAgROuWFGzKKdLDPkshUyvlqlG9pwVcgJU";
  isOpenString: any;
  isOpenBool: any;
  isOpenUnknown: boolean = false;
  detailLocation: any;

  constructor(public connectivityService: Connectivity, public geolocation: Geolocation) {
  }

  init(mapElement: any, pleaseConnect: any): Promise<any> {

    this.mapElement = mapElement;
    this.pleaseConnect = pleaseConnect;

    return this.loadGoogleMaps();

  }

  loadGoogleMaps(): Promise<any> {

    return new Promise((resolve) => {
      if(typeof google == "undefined" || typeof google.maps == "undefined"){
        console.log("Google maps JavaScript needs to be loaded.");
        this.disableMap();

        if(this.connectivityService.isOnline()){
          window['mapInit'] = () => {
            this.initMap().then(() => {
              resolve(true);
            });
            this.enableMap();
          }

          let script = document.createElement("script");
          script.id = "googleMaps";

          if(this.apiKey){
            script.src = 'http://maps.google.com/maps/api/js?key=' + this.apiKey + '&callback=mapInit&libraries=places';
          } else {
            script.src = 'http://maps.google.com/maps/api/js?callback=mapInit';
          }
          document.body.appendChild(script);
        }
      } else {
        if(this.connectivityService.isOnline()){
          this.initMap();
          this.enableMap();
        } else {
          this.disableMap();
        }
        resolve(true);
      }
      this.addConnectivityListeners();
    });
  }

  initMap(): Promise<any> {
    this.mapInitialised = true;
    return new Promise((resolve) => {
      this.geolocation.getCurrentPosition().then((position) => {
        let latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        let mapOptions = {
          center: latLng,
          zoom: 15,
          mapTypeId: google.maps.MapTypeId.ROADMAP
        }

        this.map = new google.maps.Map(this.mapElement, mapOptions);

        let service = new google.maps.places.PlacesService(this.map);
          service.nearbySearch({
            location: latLng,
            radius: 3500,
            type: 'hair_care'
          }, (results, status) => {
              this.callback(results, status)
          });

          new google.maps.Marker({position: latLng, map: this.map, animation: google.maps.Animation.DROP,
            title: "Você está aqui!", icon: {url: '../../../assets/icon/me.png' } });

        resolve(true);
      });
    });
  }

  disableMap(): void {
    if(this.pleaseConnect){
      this.pleaseConnect.style.display = "block";
    }
  }

  enableMap(): void {
    if(this.pleaseConnect){
      this.pleaseConnect.style.display = "none";
    }
  }

  addConnectivityListeners(): void {
    this.connectivityService.watchOnline().subscribe(() => {
      setTimeout(() => {
        if(typeof google == "undefined" || typeof google.maps == "undefined"){
          this.loadGoogleMaps();
        } else {
          if(!this.mapInitialised){
            this.initMap();
          }
          this.enableMap();
        }
      }, 2000);
    });
    this.connectivityService.watchOffline().subscribe(() => {
      this.disableMap();
    });
  }

  callback(results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            this.createMarker(results[i]);
          }
        }
      }

  createMarker(place) {
    var marker = new google.maps.Marker({
      map: this.map,
      position: place.geometry.location,
      icon: {url: '../../../assets/icon/dv.png' }
    });

    let infowindow = new google.maps.InfoWindow({maxWidth: 200});
    let request = {placeId: place.place_id};
    let service2 = new google.maps.places.PlacesService(this.map);
    service2.getDetails(request, function(details, status) {
      google.maps.event.addListener(marker, 'click', function() {
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
          infowindow.setContent("<strong>" + place.name + "</strong>" + '<br/>' + this.detailLocation);
          infowindow.open(this.map, marker);
          this.isOpenUnknown = false;
      });

    });
  }
}
