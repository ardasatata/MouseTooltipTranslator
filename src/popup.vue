<template>
  <v-app id="app">
    <v-fade-transition hide-on-leave>
      <!-- main page ====================================== -->
      <v-card v-if="currentPage == 'main'" tile flat>
        <v-toolbar color="blue" dark dense>
          <v-toolbar-title>
            <div>{{remainSettingDesc['appName']}}</div>
          </v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="currentPage = 'history'">
            <v-icon>mdi-history</v-icon>
          </v-btn>
          <v-app-bar-nav-icon
            @click="currentPage = 'about'"
          ></v-app-bar-nav-icon>


          <!-- tab header -->
          <template v-slot:extension>
            <v-tabs
              v-model="currentTab"
              align-with-title
            >
              <v-tabs-slider color="red"></v-tabs-slider>
              <v-tab
                v-for="tabName in tabs"
                :key="tabName"
              >
                {{ tabName }}
              </v-tab>
            </v-tabs>
          </template>
        </v-toolbar>



      <!-- tab body------------------- -->
      <v-tabs-items v-model="currentTab">
        <v-tab-item
          v-for="tabName in tabs"
          :key="tabName"
        >

        <div class="scrollList" >

          <v-card flat v-if="tabItems[tabName]">
            <v-list-item v-for="(option, optionName) in tabItems[tabName]" :key="optionName">


              <!-- single select (default null) and multiple select option -->
              <v-select
                v-if="!option.optionType  || option.optionType=='multipleSelect' "
                v-model="setting[optionName]"
                :items="option.optionList"
                item-text="text"
                item-value="val"
                :label="option.description"
                @change="onSelectChange($event, optionName)"
                :multiple="option.optionType=='multipleSelect'"
                tabName              
              >
                <!-- multiple select, selected text show -->
                <template v-if="option.optionType=='multipleSelect'" v-slot:selection="{ item, index }" >
                  <v-chip v-if="index === 0">
                    <span>{{ item.text }}</span>
                  </v-chip>
                  <span v-if="index === 1" class="grey--text text-caption">
                    (+{{ setting[optionName].length - 1 }} others)
                  </span>
                </template>
              </v-select>

              <!-- color picker option -->
              <v-text-field v-else-if="option.optionType=='colorPicker'" v-model="setting[optionName]" v-mask="mask" :label="option.description" @change="onSelectChange($event, optionName)">
                <template v-slot:append>
                  <v-menu v-model="option.menu" top nudge-bottom="105" nudge-left="16" :close-on-content-click="false">
                    <template v-slot:activator="{ on }">
                      <div :style="swatchStyle(option, optionName)" v-on="on" class="ma-1" />
                    </template>
                    <v-card>
                      <v-card-text>
                        <v-color-picker v-model="setting[optionName]" flat                />
                      </v-card-text>
                    </v-card>
                  </v-menu>
                </template>
              </v-text-field>

              

          </v-list-item>
          </v-card>
        </div>
        </v-tab-item>
      </v-tabs-items>
      </v-card>


      <!-- about page ====================================== -->
      <div v-else-if="currentPage == 'about'">
        <!-- about page img====================================== -->
        <v-img src="floating-maple-leaf.jpg" height="300px" dark class="vimage">
          <v-row class="fill-height">
            <v-card-title>
              <v-btn dark icon class="mr-4" @click="currentPage = 'main'">
                <v-icon>mdi-chevron-left</v-icon>
              </v-btn>
            </v-card-title>
            <v-spacer></v-spacer>
            <v-card-title class="white--text">
              <div class="text-h4 pl-12 pt-12">
                Mouse Tooltip<br />
                Translator
              </div>
            </v-card-title>
          </v-row>
        </v-img>

        <!-- about page contents list====================================== -->
        <v-list-item-group>
          <v-list-item
            v-for="(aboutPageItem, key) in aboutPageList"
            :key="key"
            @click="openUrl(aboutPageItem.url)"
          >
            <v-list-item-icon>
              <v-icon color="primary">
                {{ aboutPageItem.icon }}
              </v-icon>
            </v-list-item-icon>
            <v-list-item-content>
              <v-list-item-title>{{ aboutPageItem.name }}</v-list-item-title>
              <v-list-item-subtitle>{{ aboutPageItem.sub_name }}</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>
        </v-list-item-group>
      </div>

      <!-- history page ====================================== -->
      <div v-else-if="currentPage == 'history'">
        <v-toolbar color="blue" dark dense>
          <v-btn icon @click="currentPage = 'main'">
            <v-icon>mdi-chevron-left</v-icon>
          </v-btn>
          <v-toolbar-title>History</v-toolbar-title>
          <v-spacer></v-spacer>
          <v-btn icon @click="removeAllHistory">
            <v-icon>mdi-trash-can</v-icon>
          </v-btn>
          <v-btn icon @click="downloadCSV">
            <v-icon>mdi-download</v-icon>
          </v-btn>
        </v-toolbar>

        <v-list-item-group class="scrollList">
          <v-card-text>
            <span class="subheading">Record Text When</span>
            <v-chip-group
              multiple
              active-class="primary--text"
              v-model="setting['historyRecordActions']"
              @change="changeSetting"
            >
              <v-chip
                v-for="action in historyRecordActionChipList"
                :value="action.name"
                filter
                :key="action.name"
              >
                {{ action.name }}
              </v-chip>
            </v-chip-group>
          </v-card-text>
          <v-divider class="mx-4"></v-divider>

          <!-- name="list" tag="div" -->
            <v-list-item
              v-for="(history, index) in setting['historyList']"
              :key="history"
            >
              <v-list-item-content
                @click="copyToClipboard(history.sourceText, history.targetText)"
              >
                <v-list-item-title
                  v-text="history.sourceText"
                ></v-list-item-title>
                <v-list-item-subtitle
                  v-text="history.targetText"
                ></v-list-item-subtitle>
              </v-list-item-content>
              <v-list-item-action>
                <v-btn
                  icon
                  @click.prevent="removeHistory(index)"
                  @mousedown.stop
                  @touchstart.native.stop
                >
                  <v-icon color="grey lighten-1">mdi-close</v-icon>
                </v-btn>
              </v-list-item-action>
            </v-list-item>
        </v-list-item-group>

        <v-snackbar v-model="copyAlertBar">
          Item Copied
          <template v-slot:action="{ attrs }">
            <v-btn
              color="pink"
              text
              v-bind="attrs"
              @click="copyAlertBar = false"
            >
              Close
            </v-btn>
          </template>
        </v-snackbar>
      </div>
    </v-fade-transition>
  </v-app>
</template>
<script>
import { Setting } from "./setting";
import * as util from './util.js';


var langList = {
  Afrikaans: "af",
  Albanian: "sq",
  Amharic: "am",
  Arabic: "ar",
  Armenian: "hy",
  Azerbaijani: "az",
  Basque: "eu",
  Belarusian: "be",
  Bengali: "bn",
  Bosnian: "bs",
  Bulgarian: "bg",
  Catalan: "ca",
  Cebuano: "ceb",
  Chichewa: "ny",
  "Chinese Simplified": "zh-CN",
  "Chinese Traditional": "zh-TW",
  Corsican: "co",
  Croatian: "hr",
  Czech: "cs",
  Danish: "da",
  Dutch: "nl",
  English: "en",
  Esperanto: "eo",
  Estonian: "et",
  Filipino: "tl",
  Finnish: "fi",
  French: "fr",
  Frisian: "fy",
  Galician: "gl",
  Georgian: "ka",
  German: "de",
  Greek: "el",
  Gujarati: "gu",
  "Haitian Creole": "ht",
  Hausa: "ha",
  Hawaiian: "haw",
  Hebrew: "iw",
  Hindi: "hi",
  Hmong: "hmn",
  Hungarian: "hu",
  Icelandic: "is",
  Igbo: "ig",
  Indonesian: "id",
  Irish: "ga",
  Italian: "it",
  Japanese: "ja",
  Javanese: "jw",
  Kannada: "kn",
  Kazakh: "kk",
  Khmer: "km",
  Korean: "ko",
  "Kurdish (Kurmanji)": "ku",
  Kyrgyz: "ky",
  Lao: "lo",
  Latin: "la",
  Latvian: "lv",
  Lithuanian: "lt",
  Luxembourgish: "lb",
  Macedonian: "mk",
  Malagasy: "mg",
  Malay: "ms",
  Malayalam: "ml",
  Maltese: "mt",
  Maori: "mi",
  Marathi: "mr",
  Mongolian: "mn",
  "Myanmar (Burmese)": "my",
  Nepali: "ne",
  Norwegian: "no",
  Pashto: "ps",
  Persian: "fa",
  Polish: "pl",
  Portuguese: "pt",
  Punjabi: "pa",
  Romanian: "ro",
  Russian: "ru",
  Samoan: "sm",
  "Scots Gaelic": "gd",
  Serbian: "sr",
  Sesotho: "st",
  Shona: "sn",
  Sindhi: "sd",
  Sinhala: "si",
  Slovak: "sk",
  Slovenian: "sl",
  Somali: "so",
  Spanish: "es",
  Sundanese: "su",
  Swahili: "sw",
  Swedish: "sv",
  Tajik: "tg",
  Tamil: "ta",
  Telugu: "te",
  Thai: "th",
  Turkish: "tr",
  Ukrainian: "uk",
  Urdu: "ur",
  Uyghur: "ug",
  Uzbek: "uz",
  Vietnamese: "vi",
  Welsh: "cy",
  Xhosa: "xh",
  Yiddish: "yi",
  Yoruba: "yo",
  Zulu: "zu",
};
var langListWithAuto = util.concatJson({ Auto: "auto" }, langList); //copy lang and add auto
var langListOpposite=util.swapJsonKeyValue(langList);

var toggleList = {
  On: "true",
  Off: "false",
};

var keyList = {
  None: "null",
  "Ctrl Left":"ControlLeft",
  "Ctrl Right":"ControlRight",
  "Alt Left":"AltLeft",
  "Alt Right":"AltRight",
  "Shift Left":"ShiftLeft",
  "Shift Right":"ShiftRight",
  "Meta Left":"MetaLeft",
  "Meta Right":"MetaRight",
};

var ocrLangList = {
  Afrikaans: "afr",
  Albanian: "sqi",
  Amharic: "amh",
  Arabic: "ara",
  Armenian: "hye",
  Azerbaijani: "aze",
  Basque: "eus",
  Belarusian: "bel",
  Bengali: "ben",
  Bosnian: "bos",
  Bulgarian: "bul",
  Burmese: "mya",
  Catalan: "cat",
  Cebuano: "ceb",
  "Chinese Simplified": "chi_sim",
  "Chinese Simplified (vertical)": "chi_sim_vert",
  "Chinese Traditional": "chi_tra",
  "Chinese Traditional (vertical)": "chi_tra_vert",
  Corsican: "cos",
  Croatian: "hrv",
  Czech: "ces",
  Danish: "dan",
  Dutch: "nld",
  English: "eng",
  Esperanto: "epo",
  Estonian: "est",
  Filipino: "fil",
  Finnish: "fin",
  French: "fra",
  Frisian: "fry",
  Galician: "glg",
  Georgian: "kat",
  German: "deu",
  Greek: "ell",
  Gujarati: "guj",
  Haitian: "hat",
  Hebrew: "heb",
  Hindi: "hin",
  Hungarian: "hun",
  Icelandic: "isl",
  Indonesian: "ind",
  Irish: "gle",
  Italian: "ita",
  Japanese: "jpn",
  "Japanese (vertical)": "jpn_vert",
  "Japanese (vertical) old": "jpn_vert_old",
  Javanese: "jav",
  Kannada: "kan",
  Kazakh: "kaz",
  Khmer: "khm",
  Korean: "kor",
  "Korean (vertical)": "kor_vert",
  Kurdish: "kmr",
  Lao: "lao",
  Latin: "lat",
  Latvian: "lav",
  Lithuanian: "lit",
  Luxembourgish: "ltz",
  Macedonian: "mkd",
  Malay: "msa",
  Malayalam: "mal",
  Maltese: "mlt",
  Maori: "mri",
  Marathi: "mar",
  Mongolian: "mon",
  Nepali: "nep",
  Norwegian: "nor",
  Persian: "fas",
  Polish: "pol",
  Portuguese: "por",
  Romanian: "ron",
  Russian: "rus",
  "Scottish Gaelic": "gla",
  Serbian: "srp",
  Sindhi: "snd",
  Sinhala: "sin",
  Slovak: "slk",
  Slovenian: "slv",
  Spanish: "spa",
  Sundanese: "sun",
  Swahili: "swa",
  Swedish: "swe",
  Tajik: "tgk",
  Tamil: "tam",
  Telugu: "tel",
  Thai: "tha",
  Turkish: "tur",
  Ukrainian: "ukr",
  Urdu: "urd",
  Uzbek: "uzb",
  Vietnamese: "vie",
  Welsh: "cym",
  Yiddish: "yid",
  Yoruba: "yor",
};

var translatorList = {
  google: "google",
  bing: "bing",
  "papago (Experimental)": "papago"
};

var translateActionList = {
  Select: "select",
  Mouseover: "mouseover",
  "Mouseover & Select": "mouseoverselect",
};

var tooltipFontSizeList = getRangeOption(5,26,1,0); //font size 5 to 25
var tooltipWidth = getRangeOption(1,11,100,0);
var ttsVolumeList=getRangeOption(1,11,0.1,1);
var ttsRateList=getRangeOption(5,21,0.1,1);
var tooltipBackgroundBlurList=getRangeOption(0,21,1,0);


var detectTypeList = {
  Word: "word",
  Sentence: "sentence",
  Container: "container",
};

var translateReverseTargetList = util.copyJson(langList); //copy lang and add auto
translateReverseTargetList["None"] = "null";

var tooltipTextAlignList={
  Center:"center",
  Left:"left",
  Right:"right",
  Justify:"justify",
}

var settingListData = {
  useTooltip: {
    description: chrome.i18n.getMessage("Enable_Tooltip"),  // public/_locales/en/messages.json is used 
    optionList: toggleList,
  },
  useTTS: {
    description: chrome.i18n.getMessage("Enable_TTS"),
    optionList: toggleList,
  },
  translateWhen: {
    description: chrome.i18n.getMessage("Translate_When"),
    optionList: translateActionList,
  },
  translateSource: {
    description: chrome.i18n.getMessage("Translate_From"),
    optionList: langListWithAuto,
  },
  translateTarget: {
    description: chrome.i18n.getMessage("Translate_Into"),
    optionList: langList,
  },
  translatorVendor: {
    description: chrome.i18n.getMessage("Translator"),
    optionList: translatorList,
  },
  detectType: {
    description: chrome.i18n.getMessage("Text_Detect_Type"),
    optionList: detectTypeList,
  },
  keyDownTooltip: {
    description: chrome.i18n.getMessage("Tooltip_Activation_Hold_Key"),
    optionList: keyList,
  },
  keyDownTTS: {
    description: chrome.i18n.getMessage("TTS_Activation_Hold_Key"),
    optionList: keyList,
  },
  keyDownDetectSwap:{
    description: chrome.i18n.getMessage("Detect_Type_Swap_Hold_Key"),
    optionList: keyList,
  },
  translateReverseTarget: {
    description: chrome.i18n.getMessage("Reverse_Translate_Language"),
    optionList: translateReverseTargetList,
  },
  detectPDF: {
    description: chrome.i18n.getMessage("Detect_PDF"),
    optionList: toggleList,
  },
  useOCR: {
    description: chrome.i18n.getMessage("Enable_OCR"),
    optionList: toggleList,
  },
  ocrDetectionLang: {
    description: chrome.i18n.getMessage("OCR_Detection_Language"),
    optionList: ocrLangList,
  },
  langExcludeList: {
    description: chrome.i18n.getMessage("Exclude_Language"),
    optionList: langList,
    optionType: "multipleSelect",
  },
};

var visualTabData={
  tooltipFontSize: {
    description: chrome.i18n.getMessage("Tooltip_Font_Size"),
    optionList: tooltipFontSizeList,
  },
  tooltipWidth: {
    description: chrome.i18n.getMessage("Tooltip_Width"),
    optionList: tooltipWidth,
  },
  tooltipTextAlign: {
    description: chrome.i18n.getMessage("Tooltip_Text_Align"),
    optionList: tooltipTextAlignList,
  },
  tooltipBackgroundBlur: {
    description: chrome.i18n.getMessage("Tooltip_Background_Blur"),
    optionList: tooltipBackgroundBlurList,
  },
  tooltipFontColor: {
    description: chrome.i18n.getMessage("Tooltip_Font_Color"),
    optionType: "colorPicker",
    menu: false,
    optionList: {},
  },
  tooltipBackgroundColor: {
    description: chrome.i18n.getMessage("Tooltip_Background_Color"),
    optionType: "colorPicker",
    menu: false,
    optionList: {},
  },
};

var voiceTabData={
  ttsRate: {
    description: chrome.i18n.getMessage("TTS_Speed"),
    optionList: ttsRateList,
  },
  ttsVolume: {
    description: chrome.i18n.getMessage("TTS_Volume"),
    optionList: ttsVolumeList,
  },
};


var tabs=["MAIN","VISUAL","VOICE"];
var tabItems={
  "MAIN":settingListData,
  "VISUAL":visualTabData,
  "VOICE":voiceTabData,
};



var remainSettingDesc={
  "appName":chrome.i18n.getMessage("Mouse_Tooltip_Translator"),
  "Voice_for_":chrome.i18n.getMessage("Voice_for_"),
}



var aboutPageList = {
  reviewPage: {
    name: chrome.i18n.getMessage("Review_Page"),
    sub_name: chrome.i18n.getMessage("Comment_on_this_extension"),
    url: "https://chrome.google.com/webstore/detail/hmigninkgibhdckiaphhmbgcghochdjc/reviews",
    icon: "mdi-message-draw",
  },
  sourceCode: {
    name: chrome.i18n.getMessage("Source_code"),
    sub_name: chrome.i18n.getMessage("Check_source_code_in_github"),
    url: "https://github.com/ttop32/MouseTooltipTranslator",
    icon: "mdi-github",
  },
  privacyPolicy: {
    name: chrome.i18n.getMessage("Privacy_Policy"),
    sub_name: chrome.i18n.getMessage("User_privacy_policy"),
    url: "https://github.com/ttop32/MouseTooltipTranslator/blob/main/doc/privacy_policy.md",
    icon: "mdi-shield-account",
  },
  pdfViewer: {
    name:  chrome.i18n.getMessage("PDF_Viewer"),
    sub_name: chrome.i18n.getMessage("Translate_local_PDF_file") ,
    url: chrome.runtime.getURL("/pdfjs/web/viewer.html")+"?file=/pdf_demo.pdf",
    icon: "mdi-file-pdf-box",
  },
};

function getRangeOption(start,end,scale,roundOff) {
  var optionList={};
  for (let i = start; i < end; i++) {
    var num=String((i*scale).toFixed(roundOff));
    optionList[num] = num;
  }
  return optionList;
} 


export default {
  name: "app",
  data: function () {
    return {
      currentTab: null,
      tabs: tabs,
      tabItems:{},
      mask: '!#XXXXXXXX',
      remainSettingDesc:remainSettingDesc,
      height:window.innerHeight,

      aboutPageList: aboutPageList,
      setting: {},
      currentPage: "main",
      historyRecordActionChipList: [
        {
          name: "select",
          icon: "mdi-cursor-text",
        },
        {
          name: "mouseover",
          icon: "mdi-cursor-default-click",
        },
      ],
      copyAlertBar: false,
    };
  },
  async mounted() {
    this.setting = await Setting.loadSetting(await util.getDefaultData());

    this.loadTabOptionList();
    await this.addTtsVoiceTabOption();
  },

  methods: {
    onSelectChange(event, name) {
      if (name == "keyDownTooltip" && event != "null") {
        this.setting["useTooltip"] = "false";
      }
      if (name == "keyDownTTS" && event != "null") {
        this.setting["useTTS"] = "false";
      }
      this.changeSetting();
    },
    changeSetting() {
      this.setting.save();
    },
    openUrl(newURL) {
      window.open(newURL);
    },
    removeAllHistory() {
      this.setting["historyList"] = [];
      this.changeSetting();
    },
    removeHistory(index) {
      this.setting["historyList"].splice(index, 1);
      this.changeSetting();
    },
    downloadCSV() {
      var arr = this.setting["historyList"];
      var csv = arr
        .map(function (v) {
          return (
            v["sourceText"].replace(/\n|\r|,|'|"/g, " ") +
            "," +
            v["targetText"].replace(/\n|\r|,|'|"/g, " ")
          );
        })
        .join("\n");
      var link = document.createElement("a");
      link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
      link.download = "export.csv";
      link.click();
    },
    copyToClipboard(sourceText, targetText) {
      var text = sourceText + " \n" + targetText;
      navigator.clipboard.writeText(text).then((response) => {
        this.copyAlertBar = true;
      });
    },
    makeTextValList(inputList) {
      // convert {key:item}  as {text:key, val:item}
      var textValList = [];
      for (const [key2, val2] of Object.entries(inputList)) {
        textValList.push({
          text: key2,
          val: val2,
        });
      }
      return textValList;
    },
    loadTabOptionList() {
      this.tabItems=tabItems;
      for (const [tabKey, tabVal] of Object.entries(this.tabItems)) {
        for (const [key1, val1] of Object.entries(tabVal)) {
          this.tabItems[tabKey][key1]["optionList"] = this.makeTextValList(
            this.tabItems[tabKey][key1]["optionList"]
          );
        }
      }      
    },
    
    async addTtsVoiceTabOption(){
      var voiceTabOption={}
      var availableVoiceList= await util.getAvailableVoiceList();
      
      for (var key in availableVoiceList) {
        var voiceOptionList=util.getJsonFromList(availableVoiceList[key]);
        if(langListOpposite[key]){
          voiceTabOption["ttsVoice_"+key]={
            description: this.remainSettingDesc["Voice_for_"] +langListOpposite[key],
            optionList: this.makeTextValList(voiceOptionList),          
          }
        }
      }
      
      //add voice option
      this.tabItems["VOICE"] = Object.assign(this.tabItems["VOICE"], voiceTabOption)
    },
    swatchStyle(value,name){
      const color=this.setting[name];
      const menu=value.menu;
      return {
        "box-shadow": "rgba(0, 0, 0, 0.35) 0px 5px 15px",
        backgroundColor: color,
        cursor: 'pointer',
        height: '30px',
        width: '30px',
        borderRadius: menu ? '50%' : '4px',
        transition: 'border-radius 200ms ease-in-out'
      }
    }
  },
};
</script>
<style>

.v-label {
  font-size: 18px;
}

</style>
