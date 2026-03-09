// src/seed.js — populate products table with catalog + known URLs
// Run once: node src/seed.js
import db, { stmt } from './db.js';
import { recordPrice } from './db.js';

const CATALOG = [
  // ── CPUs ─────────────────────────────────────────────────────────────────
  { id:'cpu_5500',   category:'cpu', name:'AMD Ryzen 5 5500',         specs:'6C/12T · AM4 · 4.2GHz · 65W · Zen 3',              socket:'AM4',  tdp:65,
    listings:[
      { store:'Pichau',  price:570,  url:'https://www.pichau.com.br/processador-amd-ryzen-5-5500-3-6ghz-4-2ghz-turbo-cache-19mb-am4-6-core-12-threads-100-100000457box' },
      { store:'Amazon',  price:712,  url:'https://www.amazon.com.br/dp/B09HJR1Q1C' },
    ]},
  { id:'cpu_5600gt', category:'cpu', name:'AMD Ryzen 5 5600GT',       specs:'6C/12T · AM4 · 4.6GHz · 65W · iGPU Radeon',        socket:'AM4',  tdp:65,
    listings:[
      { store:'KaBuM',   price:800,  url:'https://www.kabum.com.br/produto/520368/processador-amd-ryzen-5-5600gt-3-6-ghz-4-6ghz-max-turbo-cache-4mb-6-nucleos-12-threads-am4-100-100001488box' },
      { store:'Pichau',  price:849,  url:'https://www.pichau.com.br/processador-amd-ryzen-5-5600gt-3-6ghz-4-6ghz-turbo-cache-4mb-am4-100-100001488box' },
    ]},
  { id:'cpu_5600',   category:'cpu', name:'AMD Ryzen 5 5600',         specs:'6C/12T · AM4 · 4.4GHz · 65W · Zen 3',              socket:'AM4',  tdp:65,  badge:'pop',
    listings:[
      { store:'Pichau',  price:879,  url:'https://www.pichau.com.br/processador-amd-ryzen-5-5600-3-5ghz-4-4ghz-turbo-cache-35mb-am4-6-core-12-threads-100-100000927box' },
      { store:'Microgem',price:999,  url:'https://www.microgem.com.br/produto/processador-amd-ryzen-5-5600-am4-3-5-ghz-base-4-4-ghz-max-35-mb-cache-6-core-12-threads-100-100000927box-75238' },
      { store:'Amazon',  price:1078, url:'https://www.amazon.com.br/dp/B09VCHR1VH' },
    ]},
  { id:'cpu_5600x',  category:'cpu', name:'AMD Ryzen 5 5600X',        specs:'6C/12T · AM4 · 4.6GHz · 65W · Zen 3',              socket:'AM4',  tdp:65,  badge:'dest',
    listings:[
      { store:'KaBuM',   price:1259, url:'https://www.kabum.com.br/produto/129451/processador-amd-ryzen-5-5600x-3-7ghz-4-6ghz-max-turbo-cache-35mb-am4-sem-video-100-100000065box' },
      { store:'Amazon',  price:1329, url:'https://www.amazon.com.br/dp/B08166SLDF' },
    ]},
  { id:'cpu_5700x',  category:'cpu', name:'AMD Ryzen 7 5700X',        specs:'8C/16T · AM4 · 4.6GHz · 65W · Zen 3',              socket:'AM4',  tdp:65,
    listings:[
      { store:'Amazon',  price:1099, url:'https://www.amazon.com.br/dp/B09VCCZ2PK' },
      { store:'Pichau',  price:1149, url:'https://www.pichau.com.br/processador-amd-ryzen-7-5700x-3-4ghz-4-6ghz-turbo-cache-36mb-am4-8-core-16-threads-100-100000926wof' },
    ]},
  { id:'cpu_5800x3d',category:'cpu', name:'AMD Ryzen 7 5800X3D',      specs:'8C/16T · AM4 · 4.5GHz · 3D V-Cache · 105W',        socket:'AM4',  tdp:105, badge:'pop',
    listings:[
      { store:'KaBuM',   price:1899, url:'https://www.kabum.com.br/produto/233739/processador-amd-ryzen-7-5800x3d-3-4ghz-4-5ghz-max-turbo-cache-100mb-am4-sem-video-100-100000651wof' },
      { store:'Amazon',  price:1999, url:'https://www.amazon.com.br/dp/B09VCJ2SHR' },
    ]},
  { id:'cpu_7600',   category:'cpu', name:'AMD Ryzen 5 7600',         specs:'6C/12T · AM5 · 5.1GHz · 65W · Zen 4',              socket:'AM5',  tdp:65,
    listings:[
      { store:'Pichau',  price:879,  url:'https://www.pichau.com.br/processador-amd-ryzen-5-7600-3-8ghz-5-1ghz-turbo-cache-38mb-am5-6-core-12-threads-100-100001015box' },
      { store:'KaBuM',   price:899,  url:'https://www.kabum.com.br/produto/426260/processador-amd-ryzen-5-7600-3-8ghz-5-1ghz-max-turbo-cache-38mb-am5-sem-video-100-100001015box' },
      { store:'Amazon',  price:949,  url:'https://www.amazon.com.br/dp/B0BBJDS62N' },
    ]},
  { id:'cpu_7600x',  category:'cpu', name:'AMD Ryzen 5 7600X',        specs:'6C/12T · AM5 · 5.3GHz · 105W · Zen 4',             socket:'AM5',  tdp:105, badge:'dest',
    listings:[
      { store:'Amazon',  price:1059, url:'https://www.amazon.com.br/dp/B0BBJDS98N' },
      { store:'KaBuM',   price:1099, url:'https://www.kabum.com.br/produto/426261/processador-amd-ryzen-5-7600x-4-7ghz-5-3ghz-max-turbo-cache-38mb-am5-sem-video-100-100000593box' },
    ]},
  { id:'cpu_7700x',  category:'cpu', name:'AMD Ryzen 7 7700X',        specs:'8C/16T · AM5 · 5.4GHz · 105W · Zen 4',             socket:'AM5',  tdp:105,
    listings:[
      { store:'Amazon',  price:1499, url:'https://www.amazon.com.br/dp/B0BBJHDS4M' },
      { store:'Pichau',  price:1549, url:'https://www.pichau.com.br/processador-amd-ryzen-7-7700x-4-5ghz-5-4ghz-turbo-cache-40mb-am5-8-core-16-threads-100-100000591box' },
    ]},
  { id:'cpu_7800x3d',category:'cpu', name:'AMD Ryzen 7 7800X3D',      specs:'8C/16T · AM5 · 5.0GHz · 3D V-Cache · 120W',        socket:'AM5',  tdp:120, badge:'dest',
    listings:[
      { store:'Pichau',  price:2099, url:'https://www.pichau.com.br/processador-amd-ryzen-7-7800x3d-8-core-16-threads-4-2ghz-5-0ghzturbo-cache-104mb-am5-100-100000910wof' },
      { store:'KaBuM',   price:2149, url:'https://www.kabum.com.br/produto/426262/processador-amd-ryzen-7-7800x3d-5-0ghz-max-turbo-cache-104mb-am5-8-nucleos-video-integrado-100-100000910wof' },
      { store:'Amazon',  price:2599, url:'https://www.amazon.com.br/dp/B0BTZB7F88' },
    ]},
  { id:'cpu_9600x',  category:'cpu', name:'AMD Ryzen 5 9600X',        specs:'6C/12T · AM5 · 5.4GHz · 65W · Zen 5',              socket:'AM5',  tdp:65,
    listings:[
      { store:'Pichau',  price:1239, url:'https://www.pichau.com.br/processador-amd-ryzen-5-9600x-3-9ghz-5-4ghz-turbo-cache-38mb-am5-6-core-12-threads-100-100001051box' },
      { store:'Amazon',  price:1299, url:'https://www.amazon.com.br/dp/B0CQ2S9HXS' },
    ]},
  { id:'cpu_9700x',  category:'cpu', name:'AMD Ryzen 7 9700X',        specs:'8C/16T · AM5 · 5.5GHz · 65W · Zen 5',              socket:'AM5',  tdp:65,
    listings:[
      { store:'Amazon',  price:1899, url:'https://www.amazon.com.br/dp/B0CQ2T2XMX' },
      { store:'Pichau',  price:1949, url:'https://www.pichau.com.br/processador-amd-ryzen-7-9700x-3-8ghz-5-5ghz-turbo-cache-40mb-am5-8-core-16-threads-100-100001404box' },
    ]},
  { id:'cpu_9800x3d',category:'cpu', name:'AMD Ryzen 7 9800X3D',      specs:'8C/16T · AM5 · 5.2GHz · 3D V-Cache · 120W',        socket:'AM5',  tdp:120, badge:'novo',
    listings:[
      { store:'Pichau',  price:2599, url:'https://www.pichau.com.br/processador-amd-ryzen-7-9800x3d-8-core-16-threads-4-7ghz-5-2ghz-turbo-cache-104mb-am5-100-100001084wof' },
      { store:'Amazon',  price:2699, url:'https://www.amazon.com.br/dp/B0DKFMSMYK' },
      { store:'KaBuM',   price:3699, url:'https://www.kabum.com.br/produto/662405/processador-amd-ryzen-7-9800x3d-cache-8mb-8-nucleos-16-threads-am5-100-100001084wof' },
    ]},
  { id:'cpu_9900x',  category:'cpu', name:'AMD Ryzen 9 9900X',        specs:'12C/24T · AM5 · 5.6GHz · 120W · Zen 5',            socket:'AM5',  tdp:120,
    listings:[
      { store:'Amazon',  price:2699, url:'https://www.amazon.com.br/dp/B0CQ2TSMXB' },
    ]},
  { id:'cpu_i5_12400f', category:'cpu', name:'Intel Core i5-12400F',  specs:'6C/12T · LGA1700 · 4.4GHz · 65W · Alder Lake',     socket:'LGA1700', tdp:65, badge:'pop',
    listings:[
      { store:'Amazon',  price:600,  url:'https://www.amazon.com.br/dp/B09NMPD8V2' },
      { store:'Pichau',  price:619,  url:'https://www.pichau.com.br/processador-intel-core-i5-12400f-2-5ghz-4-4ghz-turbo-lga1700-12-geracao-6-cores-12-threads-cache-18mb-bx8071512400f' },
      { store:'KaBuM',   price:649,  url:'https://www.kabum.com.br/produto/246017/processador-intel-core-i5-12400f-2-5ghz-4-4ghz-max-turbo-cache-18mb-lga-1700-bx8071512400f' },
    ]},
  { id:'cpu_i5_14400f', category:'cpu', name:'Intel Core i5-14400F',  specs:'10C/16T · LGA1700 · 4.7GHz · 65W · Raptor Lake',   socket:'LGA1700', tdp:65, badge:'dest',
    listings:[
      { store:'Amazon',  price:1099, url:'https://www.amazon.com.br/dp/B0CPXQWCKN' },
      { store:'Pichau',  price:1149, url:'https://www.pichau.com.br/processador-intel-core-i5-14400f-2-5ghz-4-7ghz-turbo-lga1700-14-geracao-10-cores-16-threads-cache-20mb-bx8071514400f' },
    ]},
  { id:'cpu_i5_14600k', category:'cpu', name:'Intel Core i5-14600K',  specs:'14C/20T · LGA1700 · 5.3GHz · 181W · Raptor Lake',  socket:'LGA1700', tdp:181, badge:'pop',
    listings:[
      { store:'Amazon',  price:1454, url:'https://www.amazon.com.br/dp/B0CHF2WQ6D' },
      { store:'Pichau',  price:1499, url:'https://www.pichau.com.br/processador-intel-core-i5-14600k-3-5ghz-5-3ghz-turbo-lga1700-14-geracao-14-cores-20-threads-cache-24mb-bx8071514600k' },
    ]},
  { id:'cpu_i7_14700f', category:'cpu', name:'Intel Core i7-14700F',  specs:'20C/28T · LGA1700 · 5.4GHz · 65W · Raptor Lake',   socket:'LGA1700', tdp:65,
    listings:[
      { store:'Amazon',  price:1898, url:'https://www.amazon.com.br/dp/B0CPXRCC4J' },
      { store:'Pichau',  price:1949, url:'https://www.pichau.com.br/processador-intel-core-i7-14700f-2-1ghz-5-4ghz-turbo-lga1700-14-geracao-20-cores-28-threads-cache-33mb-bx8071514700f' },
    ]},
  { id:'cpu_u5_245k',   category:'cpu', name:'Intel Core Ultra 5 245K', specs:'14C/14T · LGA1851 · 5.2GHz · 125W · Arrow Lake', socket:'LGA1851', tdp:125, badge:'novo',
    listings:[
      { store:'Amazon',  price:1454, url:'https://www.amazon.com.br/dp/B0CQKXNPQY' },
      { store:'Pichau',  price:1499, url:'https://www.pichau.com.br/processador-intel-core-ultra-5-245k-3-6ghz-5-2ghz-turbo-lga1851-14-geracao-14-cores-14-threads-cache-24mb-bx80768245k' },
    ]},
  { id:'cpu_u7_265k',   category:'cpu', name:'Intel Core Ultra 7 265K', specs:'20C/20T · LGA1851 · 5.5GHz · 125W · Arrow Lake', socket:'LGA1851', tdp:125,
    listings:[
      { store:'Amazon',  price:1798, url:'https://www.amazon.com.br/dp/B0CQKXRR1Y' },
      { store:'Pichau',  price:1849, url:'https://www.pichau.com.br/processador-intel-core-ultra-7-265k-3-9ghz-5-5ghz-turbo-lga1851-14-geracao-20-cores-20-threads-cache-36mb-bx80768265k' },
    ]},

  // ── GPUs ─────────────────────────────────────────────────────────────────
  { id:'gpu_3050_8gb',category:'gpu', name:'NVIDIA GeForce RTX 3050 8GB',   specs:'8GB GDDR6 · 130W · Ampere',     tdp:130, vram:8,  price:1499 },
  { id:'gpu_3060',    category:'gpu', name:'NVIDIA GeForce RTX 3060 12GB',  specs:'12GB GDDR6 · 170W · Ampere',    tdp:170, vram:12, price:2099,
    listings:[
      { store:'KaBuM',   price:2099, url:'https://www.kabum.com.br/busca/rtx+3060+12gb' },
      { store:'Pichau',  price:2149, url:'https://www.pichau.com.br/busca?q=rtx+3060+12gb' },
    ]},
  { id:'gpu_rtx5050', category:'gpu', name:'NVIDIA GeForce RTX 5050 8GB',   specs:'8GB GDDR7 · 130W · Blackwell',  tdp:130, vram:8,  badge:'novo',
    listings:[
      { store:'KaBuM',   price:1699, url:'https://www.kabum.com.br/busca/rtx+5050' },
    ]},
  { id:'gpu_rtx5060', category:'gpu', name:'NVIDIA GeForce RTX 5060 8GB',   specs:'8GB GDDR7 · 145W · Blackwell',  tdp:145, vram:8,  badge:'novo',
    listings:[
      { store:'Pichau',  price:2260, url:'https://www.pichau.com.br/busca?q=rtx+5060+8gb' },
      { store:'KaBuM',   price:2299, url:'https://www.kabum.com.br/busca/rtx+5060' },
    ]},
  { id:'gpu_5060ti8', category:'gpu', name:'NVIDIA GeForce RTX 5060 Ti 8GB', specs:'8GB GDDR7 · 180W · Blackwell', tdp:180, vram:8,  badge:'novo',
    listings:[
      { store:'Pichau',  price:2759, url:'https://www.pichau.com.br/busca?q=rtx+5060+ti+8gb' },
    ]},
  { id:'gpu_5060ti16',category:'gpu', name:'NVIDIA GeForce RTX 5060 Ti 16GB',specs:'16GB GDDR7 · 180W · Blackwell',tdp:180, vram:16, badge:'novo',
    listings:[
      { store:'Pichau',  price:3699, url:'https://www.pichau.com.br/busca?q=rtx+5060+ti+16gb' },
    ]},
  { id:'gpu_4060',    category:'gpu', name:'NVIDIA GeForce RTX 4060 8GB',   specs:'8GB GDDR6 · 115W · Ada Lovelace', tdp:115, vram:8,
    listings:[
      { store:'Pichau',  price:2599, url:'https://www.pichau.com.br/placa-de-video-msi-geforce-rtx-4060-ventus-2x-black-oc-8gb-gddr6-128-bit-912-v516-209' },
      { store:'KaBuM',   price:2699, url:'https://www.kabum.com.br/produto/484213/placa-de-video-msi-geforce-rtx-4060-gaming-x-8gb-gddr6-128-bits-912-v516-079' },
      { store:'Amazon',  price:2799, url:'https://www.amazon.com.br/dp/B0C3PWKFZ9' },
    ]},
  { id:'gpu_4060ti',  category:'gpu', name:'NVIDIA GeForce RTX 4060 Ti 8GB',specs:'8GB GDDR6 · 165W · Ada Lovelace', tdp:165, vram:8,  badge:'dest',
    listings:[
      { store:'Pichau',  price:2479, url:'https://www.pichau.com.br/placa-de-video-gigabyte-geforce-rtx-4060-ti-eagle-8gb-gddr6-128-bit-gv-n406teagle-8gd' },
      { store:'KaBuM',   price:2599, url:'https://www.kabum.com.br/busca/rtx+4060+ti+8gb' },
    ]},
  { id:'gpu_4070',    category:'gpu', name:'NVIDIA GeForce RTX 4070 12GB',  specs:'12GB GDDR6X · 200W · Ada Lovelace',tdp:200, vram:12,
    listings:[
      { store:'Pichau',  price:4277, url:'https://www.pichau.com.br/busca?q=rtx+4070+12gb' },
    ]},
  { id:'gpu_4070s',   category:'gpu', name:'NVIDIA GeForce RTX 4070 Super 12GB',specs:'12GB GDDR6X · 220W · Ada Lovelace',tdp:220, vram:12, badge:'dest',
    listings:[
      { store:'Pichau',  price:5299, url:'https://www.pichau.com.br/busca?q=rtx+4070+super' },
    ]},
  { id:'gpu_4080s',   category:'gpu', name:'NVIDIA GeForce RTX 4080 Super 16GB',specs:'16GB GDDR6X · 320W · Ada Lovelace',tdp:320,vram:16,
    listings:[
      { store:'Pichau',  price:7999, url:'https://www.pichau.com.br/busca?q=rtx+4080+super' },
    ]},
  { id:'gpu_4090',    category:'gpu', name:'NVIDIA GeForce RTX 4090 24GB',  specs:'24GB GDDR6X · 450W · Ada Lovelace',tdp:450, vram:24,
    listings:[
      { store:'Pichau',  price:11999,url:'https://www.pichau.com.br/busca?q=rtx+4090' },
    ]},
  { id:'gpu_5070',    category:'gpu', name:'NVIDIA GeForce RTX 5070 12GB',  specs:'12GB GDDR7 · 250W · Blackwell',  tdp:250, vram:12, badge:'novo',
    listings:[
      { store:'Pichau',  price:3955, url:'https://www.pichau.com.br/busca?q=rtx+5070+12gb' },
    ]},
  { id:'gpu_5070ti',  category:'gpu', name:'NVIDIA GeForce RTX 5070 Ti 16GB',specs:'16GB GDDR7 · 300W · Blackwell', tdp:300, vram:16, badge:'novo',
    listings:[
      { store:'Pichau',  price:6499, url:'https://www.pichau.com.br/busca?q=rtx+5070+ti' },
    ]},
  { id:'gpu_5080',    category:'gpu', name:'NVIDIA GeForce RTX 5080 16GB',  specs:'16GB GDDR7 · 360W · Blackwell',  tdp:360, vram:16, badge:'novo',
    listings:[
      { store:'Pichau',  price:9998, url:'https://www.pichau.com.br/busca?q=rtx+5080' },
    ]},
  { id:'gpu_arc_b570',category:'gpu', name:'Intel Arc B570 12GB',           specs:'12GB GDDR6 · 150W · Battlemage', tdp:150, vram:12, badge:'pop',
    listings:[
      { store:'KaBuM',   price:1499, url:'https://www.kabum.com.br/busca/arc+b570' },
    ]},
  { id:'gpu_arc_b580',category:'gpu', name:'Intel Arc B580 12GB',           specs:'12GB GDDR6 · 190W · Battlemage', tdp:190, vram:12,
    listings:[
      { store:'KaBuM',   price:1999, url:'https://www.kabum.com.br/busca/arc+b580' },
    ]},
  { id:'gpu_rx7600',  category:'gpu', name:'AMD Radeon RX 7600 8GB',        specs:'8GB GDDR6 · 165W · RDNA 3',     tdp:165, vram:8,  badge:'pop',
    listings:[
      { store:'Pichau',  price:1539, url:'https://www.pichau.com.br/busca?q=rx+7600+8gb' },
      { store:'Terabyte',price:1549, url:'https://www.terabyteshop.com.br/busca/?q=rx+7600' },
    ]},
  { id:'gpu_rx7700xt',category:'gpu', name:'AMD Radeon RX 7700 XT 12GB',    specs:'12GB GDDR6 · 245W · RDNA 3',    tdp:245, vram:12,
    listings:[
      { store:'Pichau',  price:2959, url:'https://www.pichau.com.br/busca?q=rx+7700+xt' },
    ]},
  { id:'gpu_rx7800xt',category:'gpu', name:'AMD Radeon RX 7800 XT 16GB',    specs:'16GB GDDR6 · 263W · RDNA 3',    tdp:263, vram:16, badge:'pop',
    listings:[
      { store:'Pichau',  price:3699, url:'https://www.pichau.com.br/busca?q=rx+7800+xt' },
    ]},
  { id:'gpu_rx7900gre',category:'gpu',name:'AMD Radeon RX 7900 GRE 16GB',   specs:'16GB GDDR6 · 260W · RDNA 3',    tdp:260, vram:16, badge:'dest',
    listings:[
      { store:'Pichau',  price:4199, url:'https://www.pichau.com.br/busca?q=rx+7900+gre' },
    ]},
  { id:'gpu_rx7900xtx',category:'gpu',name:'AMD Radeon RX 7900 XTX 24GB',   specs:'24GB GDDR6 · 355W · RDNA 3',    tdp:355, vram:24,
    listings:[
      { store:'Pichau',  price:5999, url:'https://www.pichau.com.br/busca?q=rx+7900+xtx' },
    ]},
  { id:'gpu_rx9060xt8', category:'gpu',name:'AMD Radeon RX 9060 XT 8GB',    specs:'8GB GDDR6 · 150W · RDNA 4',     tdp:150, vram:8,  badge:'novo',
    listings:[
      { store:'Pichau',  price:2159, url:'https://www.pichau.com.br/busca?q=rx+9060+xt+8gb' },
    ]},
  { id:'gpu_rx9060xt16',category:'gpu',name:'AMD Radeon RX 9060 XT 16GB',   specs:'16GB GDDR6 · 150W · RDNA 4',    tdp:150, vram:16, badge:'novo',
    listings:[
      { store:'Pichau',  price:2699, url:'https://www.pichau.com.br/busca?q=rx+9060+xt+16gb' },
    ]},
  { id:'gpu_rx9070',  category:'gpu', name:'AMD Radeon RX 9070 12GB',       specs:'12GB GDDR6 · 220W · RDNA 4',    tdp:220, vram:12, badge:'novo',
    listings:[
      { store:'Pichau',  price:4199, url:'https://www.pichau.com.br/busca?q=rx+9070' },
    ]},
  { id:'gpu_rx9070xt',category:'gpu', name:'AMD Radeon RX 9070 XT 16GB',    specs:'16GB GDDR6 · 220W · RDNA 4',    tdp:220, vram:16, badge:'novo',
    listings:[
      { store:'Pichau',  price:4599, url:'https://www.pichau.com.br/busca?q=rx+9070+xt' },
    ]},

  // ── RAM ──────────────────────────────────────────────────────────────────
  { id:'ram_8ddr4',  category:'ram', name:'Kingston Fury Beast DDR4 8GB 3200MHz',  specs:'8GB · DDR4-3200 · CL16',  ram_type:'DDR4', tdp:4,
    listings:[
      { store:'KaBuM',  price:149, url:'https://www.kabum.com.br/busca/memoria+ddr4+8gb+3200' },
      { store:'Amazon', price:169, url:'https://www.amazon.com.br/s?k=kingston+fury+beast+8gb+ddr4+3200' },
    ]},
  { id:'ram_16ddr4', category:'ram', name:'Kingston Fury Beast DDR4 16GB (2×8GB) 3200MHz', specs:'16GB kit · DDR4-3200 · CL16', ram_type:'DDR4', tdp:5, badge:'pop',
    listings:[
      { store:'KaBuM',  price:279, url:'https://www.kabum.com.br/produto/113713/memoria-ram-kingston-fury-beast-16gb-2x8gb-3200mhz-ddr4' },
      { store:'Pichau', price:289, url:'https://www.pichau.com.br/memoria-kingston-fury-beast-16gb-2x8gb-ddr4-3200mhz-kf432c16bbk2-16' },
      { store:'Amazon', price:299, url:'https://www.amazon.com.br/dp/B07WJJT5GG' },
    ]},
  { id:'ram_32ddr4', category:'ram', name:'G.Skill Ripjaws V DDR4 32GB (2×16GB) 3200MHz', specs:'32GB kit · DDR4-3200 · CL16', ram_type:'DDR4', tdp:6,
    listings:[
      { store:'Amazon', price:469, url:'https://www.amazon.com.br/dp/B015YMH6MM' },
      { store:'KaBuM',  price:489, url:'https://www.kabum.com.br/busca/memoria+ddr4+32gb+3200' },
    ]},
  { id:'ram_16ddr5', category:'ram', name:'Kingston Fury Beast DDR5 16GB (2×8GB) 5200MHz', specs:'16GB kit · DDR5-5200 · CL40', ram_type:'DDR5', tdp:6,
    listings:[
      { store:'KaBuM',  price:349, url:'https://www.kabum.com.br/busca/memoria+ddr5+16gb+5200' },
      { store:'Amazon', price:379, url:'https://www.amazon.com.br/s?k=kingston+fury+beast+ddr5+16gb+5200' },
    ]},
  { id:'ram_32ddr5', category:'ram', name:'Kingston Fury Beast DDR5 32GB (2×16GB) 5200MHz', specs:'32GB kit · DDR5-5200 · CL40', ram_type:'DDR5', tdp:7, badge:'dest',
    listings:[
      { store:'KaBuM',  price:599, url:'https://www.kabum.com.br/produto/186817/memoria-ram-kingston-fury-beast-32gb-2x16gb-5200mhz-ddr5' },
      { store:'Pichau', price:629, url:'https://www.pichau.com.br/memoria-kingston-fury-beast-32gb-2x16gb-ddr5-5200mhz-kf552c40bbk2-32' },
      { store:'Amazon', price:649, url:'https://www.amazon.com.br/dp/B0B95SFKJZ' },
    ]},
  { id:'ram_32ddr5_6000', category:'ram', name:'G.Skill Trident Z5 RGB DDR5 32GB 6000MHz', specs:'32GB kit · DDR5-6000 · CL36', ram_type:'DDR5', tdp:8, badge:'dest',
    listings:[
      { store:'Amazon', price:799, url:'https://www.amazon.com.br/s?k=gskill+trident+z5+ddr5+32gb+6000' },
    ]},
  { id:'ram_64ddr5', category:'ram', name:'G.Skill Trident Z5 RGB DDR5 64GB 6000MHz', specs:'64GB kit · DDR5-6000 · CL30', ram_type:'DDR5', tdp:10,
    listings:[
      { store:'Amazon', price:1599, url:'https://www.amazon.com.br/s?k=gskill+trident+z5+ddr5+64gb' },
    ]},

  // ── Storage ──────────────────────────────────────────────────────────────
  { id:'ssd_a400_240',  category:'storage', name:'Kingston A400 240GB SATA',     specs:'240GB · SATA · 500MB/s',  tdp:2,
    listings:[{ store:'KaBuM', price:109, url:'https://www.kabum.com.br/busca/kingston+a400+240gb' }]},
  { id:'ssd_nv2_500',   category:'storage', name:'Kingston NV2 500GB NVMe',      specs:'500GB · PCIe4 · 3500MB/s',tdp:4,
    listings:[{ store:'KaBuM', price:199, url:'https://www.kabum.com.br/busca/kingston+nv2+500gb' }]},
  { id:'ssd_nv2_1tb',   category:'storage', name:'Kingston NV2 1TB NVMe',        specs:'1TB · PCIe4 · 3500MB/s',  tdp:5, badge:'pop',
    listings:[
      { store:'KaBuM',    price:299, url:'https://www.kabum.com.br/produto/364497/ssd-kingston-nv2-1tb-m-2-nvme-snv2s-1000g' },
      { store:'Pichau',   price:319, url:'https://www.pichau.com.br/ssd-kingston-nv2-1tb-m-2-2280-nvme-snv2s-1000g' },
      { store:'Amazon',   price:329, url:'https://www.amazon.com.br/dp/B0BDVSH84T' },
    ]},
  { id:'ssd_p3_1tb',    category:'storage', name:'Crucial P3 Plus 1TB NVMe',     specs:'1TB · PCIe4 · 5000MB/s',  tdp:5,
    listings:[{ store:'Amazon', price:309, url:'https://www.amazon.com.br/dp/B0B25MMXD2' }]},
  { id:'ssd_sn850x_1tb',category:'storage', name:'WD Black SN850X 1TB NVMe',     specs:'1TB · PCIe4 · 7300MB/s',  tdp:8, badge:'dest',
    listings:[
      { store:'KaBuM',  price:499, url:'https://www.kabum.com.br/produto/226067/ssd-wd-black-sn850x-nvme-m-2-1tb-pcie-gen4-x4-7300mb-s' },
      { store:'Amazon', price:519, url:'https://www.amazon.com.br/dp/B09QV5KJHV' },
    ]},
  { id:'ssd_sn850x_2tb',category:'storage', name:'WD Black SN850X 2TB NVMe',     specs:'2TB · PCIe4 · 7300MB/s',  tdp:8,
    listings:[{ store:'Amazon', price:949, url:'https://www.amazon.com.br/dp/B09QV5QBQ4' }]},
  { id:'ssd_990pro_1tb',category:'storage', name:'Samsung 990 Pro 1TB NVMe',     specs:'1TB · PCIe4 · 7450MB/s',  tdp:8, badge:'dest',
    listings:[{ store:'KaBuM', price:549, url:'https://www.kabum.com.br/busca/samsung+990+pro+1tb' }]},
  { id:'ssd_990pro_2tb',category:'storage', name:'Samsung 990 Pro 2TB NVMe',     specs:'2TB · PCIe4 · 7450MB/s',  tdp:8,
    listings:[{ store:'KaBuM', price:999, url:'https://www.kabum.com.br/busca/samsung+990+pro+2tb' }]},
  { id:'hdd_barracuda_2tb',category:'storage',name:'Seagate Barracuda 2TB HDD',  specs:'2TB · SATA · 7200RPM',    tdp:10,
    listings:[{ store:'Amazon', price:329, url:'https://www.amazon.com.br/dp/B01LNJBA5O' }]},
  { id:'hdd_barracuda_4tb',category:'storage',name:'Seagate Barracuda 4TB HDD',  specs:'4TB · SATA · 5400RPM',    tdp:12,
    listings:[{ store:'Amazon', price:479, url:'https://www.amazon.com.br/dp/B07H289S7C' }]},
];

// ── Seed transaction ──────────────────────────────────────────────────────────
const seedAll = db.transaction(() => {
  let count = 0;
  for (const p of CATALOG) {
    stmt.upsertProduct.run({
      id: p.id, category: p.category, name: p.name, specs: p.specs ?? null,
      badge: p.badge ?? null, socket: p.socket ?? null, tdp: p.tdp ?? null,
      ram_type: p.ram_type ?? null, form_factor: p.form_factor ?? null,
      wattage: p.wattage ?? null, vram: p.vram ?? null,
    });
    for (const l of (p.listings || [])) {
      recordPrice(p.id, l.store, l.url, l.price);
    }
    count++;
  }
  return count;
});

const n = seedAll();
console.log(`✅ Seeded ${n} products`);
process.exit(0);
