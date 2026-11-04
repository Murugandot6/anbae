export interface TrendingItem {
  id: string;
  title: string;
  subtitle: string;
  type: 'song' | 'album';
  image: string;
  language: string;
  year: string;
  more_info: {
    song_count?: string;
    release_date?: string;
    duration?: string;
    album_id?: string;
    album?: string;
    artistMap?: {
      artists: { id: string; name: string; role: string }[];
    };
  };
}

export const TRENDING_TODAY_DATA: TrendingItem[] = [
  {
    "id": "76070868",
    "title": "Karuppu (Original Motion Picture Soundtrack)",
    "subtitle": "Sai Abhyankkar",
    "type": "album",
    "image": "https://c.saavncdn.com/875/Karuppu-Original-Motion-Picture-Soundtrack-Tamil-2026-20260525175054-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "3",
      "release_date": "2026-05-25",
      "artistMap": {
        "artists": [
          { "id": "14477737", "name": "Sai Abhyankkar", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "Ck1V-H4b",
    "title": "Raga of Revenge (From \"DC\")",
    "subtitle": "Anirudh Ravichander",
    "type": "song",
    "image": "https://c.saavncdn.com/484/Raga-of-Revenge-From-DC-Tamil-2026-20260515180436-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "131",
      "album_id": "75742902",
      "album": "Raga of Revenge (From \"DC\")",
      "artistMap": {
        "artists": [
          { "id": "455663", "name": "Anirudh Ravichander", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "ddvCLd72",
    "title": "Cook Cook (From \"Chiyaan 63\")",
    "subtitle": "Santhosh Narayanan",
    "type": "song",
    "image": "https://c.saavncdn.com/850/Cook-Cook-From-Chiyaan-63-Tamil-2026-20260417203656-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "53",
      "album_id": "74723827",
      "album": "Cook Cook (From \"Chiyaan 63\")",
      "artistMap": {
        "artists": [
          { "id": "557323", "name": "Santhosh Narayanan", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "BRxC-X9m",
    "title": "Goindhamma (From \"Meesaya Murukku 2\")",
    "subtitle": "Hiphop Tamizha",
    "type": "song",
    "image": "https://c.saavncdn.com/684/Goindhamma-From-Meesaya-Murukku-2-Tamil-2026-20260518093512-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "192",
      "album_id": "75804959",
      "album": "Goindhamma (From \"Meesaya Murukku 2\")",
      "artistMap": {
        "artists": [
          { "id": "773021", "name": "Hiphop Tamizha", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "74762778",
    "title": "Kara (Original Motion Picture Soundtrack)",
    "subtitle": "G. V. Prakash",
    "type": "album",
    "image": "https://c.saavncdn.com/748/Kara-Original-Motion-Picture-Soundtrack-Tamil-2026-20260418183138-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "4",
      "release_date": "2026-04-20",
      "artistMap": {
        "artists": [
          { "id": "509710", "name": "G. V. Prakash", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "76172053",
    "title": "Peddi - Tamil",
    "subtitle": "A.R. Rahman",
    "type": "album",
    "image": "https://c.saavncdn.com/704/Peddi-Tamil-Tamil-2026-20260528131105-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "5",
      "release_date": "2026-05-28",
      "artistMap": {
        "artists": [
          { "id": "456269", "name": "A.R. Rahman", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "0Stcg9lC",
    "title": "Sigma Style (From \"Sigma\") (Tamil)",
    "subtitle": "Thaman S",
    "type": "song",
    "image": "https://c.saavncdn.com/737/Sigma-Style-From-Sigma-Tamil-Tamil-2026-20260604073605-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "206",
      "album_id": "76459137",
      "album": "Sigma Style (From \"Sigma\") (Tamil)",
      "artistMap": {
        "artists": [
          { "id": "544471", "name": "Thaman S", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "74260975",
    "title": "Love Insurance Kompany",
    "subtitle": "Anirudh Ravichander",
    "type": "album",
    "image": "https://c.saavncdn.com/360/Love-Insurance-Kompany-Tamil-2026-20260409150801-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "4",
      "release_date": "2026-04-06",
      "artistMap": {
        "artists": [
          { "id": "455663", "name": "Anirudh Ravichander", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "76461607",
    "title": "Parimala and Co (Original Motion Picture Soundtrack)",
    "subtitle": "Foxn",
    "type": "album",
    "image": "https://c.saavncdn.com/476/Parimala-and-Co-Original-Motion-Picture-Soundtrack-Tamil-2026-20260604153933-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "3",
      "release_date": "2026-06-04",
      "artistMap": {
        "artists": [
          { "id": "1650991", "name": "Foxn", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "hrRGlsK5",
    "title": "Pappali Pazhamey (From \"Meesaya Murukku 2\")",
    "subtitle": "Hiphop Tamizha",
    "type": "song",
    "image": "https://c.saavncdn.com/511/Pappali-Pazhamey-From-Meesaya-Murukku-2-Tamil-2026-20260409103405-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "206",
      "album_id": "74263903",
      "album": "Pappali Pazhamey (From \"Meesaya Murukku 2\")",
      "artistMap": {
        "artists": [
          { "id": "773021", "name": "Hiphop Tamizha", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "34XumkCJ",
    "title": "Fraud Payale (From \"Con City\")",
    "subtitle": "Sean Roldan",
    "type": "song",
    "image": "https://c.saavncdn.com/785/Fraud-Payale-From-Con-City-Tamil-2026-20260529161035-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "226",
      "album_id": "76220979",
      "album": "Fraud Payale (From \"Con City\")",
      "artistMap": {
        "artists": [
          { "id": "718103", "name": "Sean Roldan", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "QCAIzhBY",
    "title": "Oru Nodi (From \"Heartin\")",
    "subtitle": "Rajesh Murugesan",
    "type": "song",
    "image": "https://c.saavncdn.com/692/Oru-Nodi-From-Heartin-Tamil-2026-20260602143204-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "239",
      "album_id": "76370679",
      "album": "Oru Nodi (From \"Heartin\")",
      "artistMap": {
        "artists": [
          { "id": "718035", "name": "Rajesh Murugesan", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "9fCnzTzV",
    "title": "Psilo Vibin",
    "subtitle": "Paal Dabba",
    "type": "song",
    "image": "https://c.saavncdn.com/917/Psilo-Vibin-Tamil-2026-20260423133159-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "143",
      "album_id": "73229328",
      "album": "Psilo Vibin",
      "artistMap": {
        "artists": [
          { "id": "14228777", "name": "Paal Dabba", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "76233017",
    "title": "S.Saraswathi - Tamil",
    "subtitle": "Thaman S",
    "type": "album",
    "image": "https://c.saavncdn.com/672/S-Saraswathi-Tamil-Tamil-2026-20260529203422-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "6",
      "release_date": "2026-06-01",
      "artistMap": {
        "artists": [
          { "id": "461088", "name": "Thaman S", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "75681193",
    "title": "Sattendru Maarudhu Vaanilai",
    "subtitle": "Girishh G",
    "type": "album",
    "image": "https://c.saavncdn.com/068/Sattendru-Maarudhu-Vaanilai-Tamil-2026-20260514131034-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "4",
      "release_date": "2026-05-14",
      "artistMap": {
        "artists": [
          { "id": "538233", "name": "Girishh G", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "rqpfJx2g",
    "title": "Naanga Naalu Peru (From \"Karuppu\")",
    "subtitle": "Sai Abhyankkar",
    "type": "song",
    "image": "https://c.saavncdn.com/052/Naanga-Naalu-Peru-From-Karuppu-Tamil-2026-20260327132334-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "197",
      "album_id": "73742472",
      "album": "Naanga Naalu Peru (From \"Karuppu\")",
      "artistMap": {
        "artists": [
          { "id": "14477737", "name": "Sai Abhyankkar", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "hBdHJuyG",
    "title": "Naan Dhaan King (From \"Con City\")",
    "subtitle": "Sean Roldan",
    "type": "song",
    "image": "https://c.saavncdn.com/214/Naan-Dhaan-King-From-Con-City-Tamil-2026-20260509121026-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "246",
      "album_id": "75483170",
      "album": "Naan Dhaan King (From \"Con City\")",
      "artistMap": {
        "artists": [
          { "id": "718103", "name": "Sean Roldan", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "a_8fxM5s",
    "title": "Vaa Endrathum (From \"Charukesi\")",
    "subtitle": "P. Unni Krishnan",
    "type": "song",
    "image": "https://c.saavncdn.com/776/Vaa-Endrathum-From-Charukesi-Tamil-2026-20260602173545-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "478",
      "album_id": "76381783",
      "album": "Vaa Endrathum (From \"Charukesi\")",
      "artistMap": {
        "artists": [
          { "id": "455219", "name": "Deva", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "3QS5a5yd",
    "title": "Vellichudare (From \"Irandu Vaanam\")",
    "subtitle": "Dhibu Ninan Thomas",
    "type": "song",
    "image": "https://c.saavncdn.com/583/Vellichudare-From-Irandu-Vaanam-Tamil-2026-20260424083405-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "255",
      "album_id": "74983756",
      "album": "Vellichudare (From \"Irandu Vaanam\")",
      "artistMap": {
        "artists": [
          { "id": "743307", "name": "Dhibu Ninan Thomas", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "75357016",
    "title": "29",
    "subtitle": "Sean Roldan",
    "type": "album",
    "image": "https://c.saavncdn.com/314/29-Tamil-2026-20260506165957-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "5",
      "release_date": "2026-05-06",
      "artistMap": {
        "artists": [
          { "id": "718103", "name": "Sean Roldan", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "_CZQBSGG",
    "title": "Amma Amma Dhaan (From \"Nooru Sami\")",
    "subtitle": "Balaji Sriram",
    "type": "song",
    "image": "https://c.saavncdn.com/994/Amma-Amma-Dhaan-From-Nooru-Sami-Tamil-2026-20260430122519-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "237",
      "album_id": "75164617",
      "album": "Amma Amma Dhaan (From \"Nooru Sami\")",
      "artistMap": {
        "artists": [
          { "id": "21663124", "name": "Balaji Sriram", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "O7_zFC2e",
    "title": "Iyalisaiye (From \"Yen Ennai Edho Seidhai\")",
    "subtitle": "Jaikar Harinath",
    "type": "song",
    "image": "https://c.saavncdn.com/526/Iyalisaiye-From-Yen-Ennai-Edho-Seidhai-Tamil-2026-20260522193400-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "211",
      "album_id": "75992822",
      "album": "Iyalisaiye (From \"Yen Ennai Edho Seidhai\")",
      "artistMap": {
        "artists": [
          { "id": "25731268", "name": "Jaikar Harinath", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "TtWpAuMx",
    "title": "Unnai Nambi (From \" Lenin Pandiyan\")",
    "subtitle": "Ilaiyaraaja",
    "type": "song",
    "image": "https://c.saavncdn.com/569/Unnai-Nambi-From-Lenin-Pandiyan-Tamil-2026-20260427113405-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "301",
      "album_id": "75054746",
      "album": "Unnai Nambi (From \" Lenin Pandiyan\")",
      "artistMap": {
        "artists": [
          { "id": "457536", "name": "Ilaiyaraaja", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "hv1H8MG_",
    "title": "Pavazha Malli (From \"Think Indie\")",
    "subtitle": "Sai Abhyankkar",
    "type": "song",
    "image": "https://c.saavncdn.com/984/Pavazha-Malli-From-Think-Indie-Tamil-2026-20260303084345-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "252",
      "album_id": "72970173",
      "album": "Pavazha Malli (From \"Think Indie\")",
      "artistMap": {
        "artists": [
          { "id": "14477737", "name": "Sai Abhyankkar", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "YdswA-2U",
    "title": "Uyire (From \"Double Occupancy\")",
    "subtitle": "Sam C.S.",
    "type": "song",
    "image": "https://c.saavncdn.com/653/Uyire-From-Double-Occupancy-Tamil-2026-20260512083505-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "203",
      "album_id": "75593304",
      "album": "Uyire (From \"Double Occupancy\")",
      "artistMap": {
        "artists": [
          { "id": "594484", "name": "Sam C.S.", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "ZAwo80kX",
    "title": "Kannakuzhiya (From \"Hi\")",
    "subtitle": "Jen Martin",
    "type": "song",
    "image": "https://c.saavncdn.com/822/Kannakuzhiya-From-Hi-Tamil-2026-20260421123301-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "189",
      "album_id": "74863876",
      "album": "Kannakuzhiya (From \"Hi\")",
      "artistMap": {
        "artists": [
          { "id": "8497760", "name": "Jen Martin", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "XHwAd5c0",
    "title": "Aura 10/10 (From \"Meesaya Murukku 2\")",
    "subtitle": "Hiphop Tamizha",
    "type": "song",
    "image": "https://c.saavncdn.com/290/Aura-10-10-From-Meesaya-Murukku-2-Tamil-2026-20260303073304-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "129",
      "album_id": "72976062",
      "album": "Aura 10/10 (From \"Meesaya Murukku 2\")",
      "artistMap": {
        "artists": [
          { "id": "773021", "name": "Hiphop Tamizha", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "71510923",
    "title": "Moonwalk",
    "subtitle": "A R Rahman",
    "type": "album",
    "image": "https://c.saavncdn.com/901/Moonwalk-Tamil-2026-20260114130001-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "4",
      "release_date": "2026-01-13",
      "artistMap": {
        "artists": [
          { "id": "828628", "name": "A R Rahman", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "73802277",
    "title": "Youth",
    "subtitle": "Ken Karunaas",
    "type": "album",
    "image": "https://c.saavncdn.com/057/Youth-Tamil-2026-20260325113757-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "song_count": "5",
      "release_date": "2026-03-25",
      "artistMap": {
        "artists": [
          { "id": "2144637", "name": "Ken Karunaas", "role": "music" }
        ]
      }
    }
  },
  {
    "id": "Nc-DXXKk",
    "title": "Raavana Mavandaa (From \"Jana Nayagan\")",
    "subtitle": "Anirudh Ravichander",
    "type": "song",
    "image": "https://c.saavncdn.com/504/Raavana-Mavandaa-From-Jana-Nayagan-Tamil-2026-20260102181036-150x150.jpg",
    "language": "tamil",
    "year": "2026",
    "more_info": {
      "duration": "107",
      "album_id": "71227719",
      "album": "Raavana Mavandaa (From \"Jana Nayagan\")",
      "artistMap": {
        "artists": [
          { "id": "455663", "name": "Anirudh Ravichander", "role": "music" }
        ]
      }
    }
  }
];