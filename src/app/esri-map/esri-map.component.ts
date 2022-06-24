import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  Input,
  Output,
  EventEmitter,
  OnDestroy
} from "@angular/core";
import { loadModules } from "esri-loader";
import * as ImageryLayer from "esri/layers/ImageryLayer";
import esri = __esri; // Esri TypeScript Types

@Component({
  selector: "app-esri-map",
  templateUrl: "./esri-map.component.html",
  styleUrls: ["./esri-map.component.scss"]
})
export class EsriMapComponent implements OnInit, OnDestroy {
  @Output() mapLoadedEvent = new EventEmitter<boolean>();

  // The <div> where we will place the map
  @ViewChild("mapViewNode", { static: true }) private mapViewEl: ElementRef;

  // @ViewChild("timeSlider", { static: true }) private timeSliderEl: ElementRef;

  /**
   * _zoom sets map zoom
   * _center sets map center
   * _basemap sets type of map
   * _loaded provides map loaded status
   */
  private _zoom = 10;
  private _center: Array<number> = [51.8320,5.7281];
  private _basemap = "topographic";
  private _loaded = false;
  private _view: esri.MapView = null;

  get mapLoaded(): boolean {
    return this._loaded;
  }

  @Input()
  set zoom(zoom: number) {
    this._zoom = zoom;
  }

  get zoom(): number {
    return this._zoom;
  }

  @Input()
  set center(center: Array<number>) {
    this._center = center;
  }

  get center(): Array<number> {
    return this._center;
  }

  @Input()
  set basemap(basemap: string) {
    this._basemap = basemap;
  }

  get basemap(): string {
    return this._basemap;
  }

  constructor() {}

  async initializeMap() {
    try {
      // Load the modules for the ArcGIS API for JavaScript
      const [esriConfig, 
              Map, 
              MapView, 
              FeatureLayer, 
              Editor, 
              Locate, 
              WMSLayer, 
              ImageryLayer,
              LayerList, 
              Legend,
              Expand,
              TimeSlider] = await loadModules([
        "esri/config",
        "esri/Map",
        "esri/views/MapView",
        "esri/layers/FeatureLayer",
        "esri/widgets/Editor",
        "esri/widgets/Locate",
        "esri/layers/WMSLayer",
        "esri/layers/ImageryLayer",
        "esri/widgets/LayerList",
        "esri/widgets/Legend",
        "esri/widgets/Expand",
        "esri/widgets/TimeSlider"
      ]);

      // esri.config.apiKey
      esriConfig.apiKey = 'AAPK0b79cc8d2a3b48d2b434b77dc993d00f-0s3GfO9uZPhbLVmg7a9_OnbOfjZCWO4EutxA4DGKgX5W-fgxCiWQAYsfB7ve7pQ'
      
      // define and add layers
      const spottedRenderer = {
        "type": "simple",
        "symbol": {
          "type": "picture-marker",
          "url": "https://static.arcgis.com/images/Symbols/Shapes/BlackStarLargeB.png",
          "width": "25px",
          "height": "25px"
        }
      }

      const spottedLabels = {
        symbol: {
          type: "text",
          color: "#FFFFFF",
          haloColor: "#5E8D74",
          haloSize: "2px",
          font: {
            size: "15px",
            family: "Noto Sans",
            style: "italic",
            weight: "normal"
          }
        },
        labelPlacement: "above-center",
        labelExpressionInfo: {
          expression: "$feature.Name"
        }
      };

      const windLayer = new ImageryLayer({
        url: "https://meteo.arcgisonline.nl/arcgis/rest/services/KNMI/HARM40_V1_WIND/ImageServer",
        // url: "https://sampleserver6.arcgisonline.com/arcgis/rest/services/ScientificData/NDFD_wind/ImageServer",
        // renderer: {
        //   type: "flow",
        //   color: [50, 120, 240, 1],
        //   style: "beaufort-km", 
        //   flowRepresentation: "flow-from", 
        //   flowSpeed: 15
        // }
      });

      const testLayer = new FeatureLayer({
        url: "https://services6.arcgis.com/aoxdxNQ2HQoLa9ob/arcgis/rest/services/testlayer/FeatureServer/0"
        // renderer: spottedRenderer,
        // labelingInfo: [spottedLabels],
        // definitionExpression: "Type = 'spotted'"
      });

      // const wbeGebieden = new WMSLayer({
      //   url: "https://geoserver.gelderland.nl/geoserver/ngr_c/wms?service=WMS&request=GetCapabilities"
      // });

      const perceelLayer = new WMSLayer({
        url: "	https://geodata.nationaalgeoregister.nl/kadastralekaart/wms/v4_0?service=WMS&version=1.3.0&request=GetCapabilities",
        // copyright:
        //   "<a target='_top' href='https://earthdata.nasa.gov'>Earthdata</a> by <a target='_top' href='https://www.nasa.gov'>NASA</a>",
        // activeLayer: {
        //   id: "SRTM_Color_Index"
        // }
      }); 

      // Instantiate esri map
      const mapProperties: esri.MapProperties = {
        basemap: this._basemap,
        layers:[testLayer, perceelLayer, windLayer]
      };
      const map: esri.Map = new Map(mapProperties);

      // Setup view
      const mapViewProperties: esri.MapViewProperties = {
        container: this.mapViewEl.nativeElement,
        center: this._center,
        zoom: this._zoom,
        map: map
      };
      this._view = new MapView(mapViewProperties);

      // Add editor widget
      const editor = new Editor({
        view: this._view
      }) 
      this._view.ui.add(editor, "top-right")

      // Add current location widget
      const locate = new Locate({
        view: this._view,
        useHeadingEnabled: false,
        goToOverride: function(view, options) {
          options.target.scale = 1500;
          return view.goTo(options.target);
        }
      });
      this._view.ui.add(locate, "top-leading");

      // Add layerlist widget
      const layerList = new LayerList({
        view: this._view
      });
      this._view.ui.add(layerList, "top-leading");


      // Add legend widget + expand
      const legend = new Legend({
        view: this._view
      })
      const legendExpand = new Expand({
        view: this._view,
        content: legend
      });
      this._view.ui.add(legendExpand, "top-left");

      // time slider widget initialization
      const timeSlider = new TimeSlider({
        container: "timeSlider",
        // mode: "time-window",
        view: this._view,
        timeVisible: true,
        loop: true
      });
      // this._view.ui.add(timeSlider, "bottom-right");

      this._view.whenLayerView(windLayer).then((lv) => {
        timeSlider.fullTimeExtent = windLayer.timeInfo.fullTimeExtent.expandTo("hours");
        timeSlider.stops = {
          interval: windLayer.timeInfo.interval
        };
      });


      // await this._view.when();
      return this._view;
    } catch (error) {
      console.log("EsriLoader: ", error);
    }
  }

  ngOnInit() {
    // Initialize MapView and return an instance of MapView
    this.initializeMap().then(mapView => {
      // The map has been initialized
      console.log("mapView ready: ", this._view.ready);
      this._loaded = this._view.ready;
      this.mapLoadedEvent.emit(true);
    });
  }

  ngOnDestroy() {
    if (this._view) {
      // destroy the map view
      this._view.container = null;
    }
  }
}
