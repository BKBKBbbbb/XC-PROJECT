// 为每个城市批量创建 5 家真实风格的酒店测试数据
// 要求：
// - 免费停车场：是（freeParking = 1）
// - 免费 WiFi：是（freeWifi = 1）
// - 早餐服务：自助早（breakfastType = 'buffet'）
// - 亲子友好：是（familyFriendly = 1）
// - 可携带宠物：是（petsAllowed = 1）

const bcrypt = require('bcryptjs');
const pool = require('./utils/db');
const { randomUUID } = require('crypto');

// 目前前端支持的城市（与小程序首页/列表页保持一致）
const CITY_LIST = ['上海', '北京', '杭州', '广州', '深圳', '成都', '重庆', '西安', '南京'];

// 每个城市 5 个酒店的基础信息（尽量贴近真实酒店名称和地址）
// 这里只存放与城市强相关的字段，其它统一逻辑生成
const CITY_HOTELS = {
  上海: [
    {
      name: '上海外滩华尔道夫酒店',
      nameEn: 'Waldorf Astoria Shanghai on the Bund',
      address: '黄浦区中山东一路2号',
      star: 5,
      description: '位于外滩源头，步行可达南京路步行街，部分房型可270度观赏黄浦江与外滩夜景。',
      basePrice: 2888
    },
    {
      name: '上海浦东丽思卡尔顿酒店',
      nameEn: 'The Ritz-Carlton Shanghai, Pudong',
      address: '浦东新区世纪大道8号',
      star: 5,
      description: '坐拥陆家嘴核心区，高楼层景观房可俯瞰东方明珠与黄浦江夜景，适合商务与情侣出行。',
      basePrice: 2588
    },
    {
      name: '上海静安香格里拉大酒店',
      nameEn: 'Jing An Shangri-La, Shanghai',
      address: '静安区延安中路1218号',
      star: 5,
      description: '位于静安寺及南京西路商圈，连通大型购物中心，集商务、购物、休闲于一体。',
      basePrice: 1988
    },
    {
      name: '上海金茂君悦大酒店',
      nameEn: 'Grand Hyatt Shanghai',
      address: '浦东新区世纪大道88号金茂大厦',
      star: 5,
      description: '位于金茂大厦高区，酒店空中大堂与高空酒吧极具地标性，可俯瞰陆家嘴与外滩。',
      basePrice: 1688
    },
    {
      name: '上海虹桥雅居乐万豪酒店',
      nameEn: 'Marriott Shanghai Hongqiao',
      address: '长宁区虹桥路2270号',
      star: 5,
      description: '临近虹桥交通枢纽及国家会展中心，提供接驳服务，是参展与商务出行的热门选择。',
      basePrice: 1288
    }
  ],
  北京: [
    {
      name: '北京王府半岛酒店',
      nameEn: 'The Peninsula Beijing',
      address: '东城区金鱼胡同8号',
      star: 5,
      description: '位于王府井商圈腹地，步行可至故宫和天安门广场，服务细致，适合高端商务与家庭出行。',
      basePrice: 2288
    },
    {
      name: '北京国贸大酒店',
      nameEn: 'China World Summit Wing Beijing',
      address: '朝阳区建国门外大街1号',
      star: 5,
      description: '坐落于国贸三期高层，视野开阔，可俯瞰北京城市天际线，直通大型商场与写字楼。',
      basePrice: 2088
    },
    {
      name: '北京金融街洲际酒店',
      nameEn: 'InterContinental Beijing Financial Street',
      address: '西城区金融街11号',
      star: 5,
      description: '位于金融街核心商务区，配套完善，步行可达多家金融机构与购物中心。',
      basePrice: 1680
    },
    {
      name: '北京东方君悦大酒店',
      nameEn: 'Grand Hyatt Beijing',
      address: '东城区东方广场东长安街1号',
      star: 5,
      description: '地处长安街与王府井交汇处，地理位置优越，酒店室内泳池设计独特。',
      basePrice: 1880
    },
    {
      name: '北京望京凯悦酒店',
      nameEn: 'Hyatt Regency Beijing Wangjing',
      address: '朝阳区广顺南大街8号院9号楼',
      star: 5,
      description: '身处望京核心区，紧邻写字楼与商业综合体，适合互联网园区周边商务客人。',
      basePrice: 1380
    }
  ],
  杭州: [
    {
      name: '杭州西子湖四季酒店',
      nameEn: 'Four Seasons Hotel Hangzhou at West Lake',
      address: '西湖区杨公堤5号',
      star: 5,
      description: '依偎西子湖畔，园林景观典雅精致，部分房型可一览湖景与庭院，是度假休闲的热门选择。',
      basePrice: 3280
    },
    {
      name: '杭州洲际酒店',
      nameEn: 'InterContinental Hangzhou',
      address: '江干区解放东路2号',
      star: 5,
      description: '位于钱江新城地标性“太阳”造型建筑内，近市民中心及音乐喷泉。',
      basePrice: 1680
    },
    {
      name: '杭州索菲特西湖大酒店',
      nameEn: 'Sofitel Hangzhou Westlake',
      address: '上城区湖滨路333号',
      star: 5,
      description: '临近西湖湖滨步行街，周边餐饮购物丰富，适合亲子与情侣漫步湖畔。',
      basePrice: 1480
    },
    {
      name: '杭州城中香格里拉大酒店',
      nameEn: 'Midtown Shangri-La, Hangzhou',
      address: '下城区延安路6号湖滨银泰',
      star: 5,
      description: '衔接湖滨银泰、武林广场等核心商圈，出行及购物便利。',
      basePrice: 1580
    },
    {
      name: '杭州雷迪森铂丽大饭店',
      nameEn: 'Radisson Blu Hangzhou Xintiandi',
      address: '拱墅区东新路836号',
      star: 4,
      description: '靠近城北商圈，驾车前往西湖及运河都较为便利，性价比较高。',
      basePrice: 880
    }
  ],
  广州: [
    {
      name: '广州四季酒店',
      nameEn: 'Four Seasons Hotel Guangzhou',
      address: '天河区珠江西路5号广州国际金融中心',
      star: 5,
      description: '位于珠江新城 IFC 高层，部分房型可远眺小蛮腰与珠江夜景，配套高端商场与写字楼。',
      basePrice: 2280
    },
    {
      name: '广州文华东方酒店',
      nameEn: 'Mandarin Oriental Guangzhou',
      address: '天河区天河北路389号',
      star: 5,
      description: '坐落于太古汇综合体内，直通地铁与购物中心，餐饮选择丰富。',
      basePrice: 1980
    },
    {
      name: '广州白天鹅宾馆',
      nameEn: 'White Swan Hotel',
      address: '荔湾区沙面南街1号',
      star: 5,
      description: '屹立于沙面岛上，江景与园林相映成趣，是广州经典老牌五星酒店。',
      basePrice: 1580
    },
    {
      name: '广州富力丽思卡尔顿酒店',
      nameEn: 'The Ritz-Carlton Guangzhou',
      address: '天河区珠江西路3号',
      star: 5,
      description: '珠江新城中轴线附近，步行可至花城广场与歌剧院，商务与休闲皆宜。',
      basePrice: 1880
    },
    {
      name: '广州圣丰索菲特大酒店',
      nameEn: 'Sofitel Guangzhou Sunrich',
      address: '天河区广州大道中988号',
      star: 5,
      description: '靠近体育西商圈，周边写字楼及商场密集，交通便捷。',
      basePrice: 1280
    }
  ],
  深圳: [
    {
      name: '深圳湾安达仕酒店',
      nameEn: 'Andaz Shenzhen Bay',
      address: '南山区科苑南路2600号',
      star: 5,
      description: '位于深圳湾超级总部基地，设计感突出，步行可至海滨长廊与购物中心。',
      basePrice: 2280
    },
    {
      name: '深圳福田香格里拉大酒店',
      nameEn: 'Shangri-La Shenzhen Futian',
      address: '福田区益田路4088号',
      star: 5,
      description: '紧邻会展中心与城市中轴线，适合会展与商务客人。',
      basePrice: 1680
    },
    {
      name: '深圳文华东方酒店',
      nameEn: 'Mandarin Oriental Shenzhen',
      address: '福田区彩田路与红荔路交汇处',
      star: 5,
      description: '坐拥城市景观与高端配套，周边写字楼及高端住宅集中。',
      basePrice: 2580
    },
    {
      name: '深圳湾万丽酒店',
      nameEn: 'Renaissance Shenzhen Bay Hotel',
      address: '南山区侨香路与科苑南路交界',
      star: 5,
      description: '毗邻高新园区与深圳湾口岸，商务与旅游出行皆方便。',
      basePrice: 1480
    },
    {
      name: '深圳威尼斯睿途酒店',
      nameEn: 'The Venice Raytour Hotel Shenzhen',
      address: '南山区华侨城深南大道9026号',
      star: 5,
      description: '位于华侨城度假区，靠近欢乐谷与世界之窗，适合亲子游与周末度假。',
      basePrice: 1180
    }
  ],
  成都: [
    {
      name: '成都富力丽思卡尔顿酒店',
      nameEn: 'The Ritz-Carlton Chengdu',
      address: '青羊区人民南路一段269号',
      star: 5,
      description: '位于市中心天府广场附近，高区房间可俯瞰城市景观，周边小吃与购物丰富。',
      basePrice: 1580
    },
    {
      name: '成都博舍',
      nameEn: 'The Temple House Chengdu',
      address: '锦江区笔帖式街81号',
      star: 5,
      description: '结合传统院落与现代设计，坐落于太古里商业区，是文艺与设计感并存的网红酒店。',
      basePrice: 1980
    },
    {
      name: '成都香格里拉大酒店',
      nameEn: 'Shangri-La Hotel Chengdu',
      address: '锦江区滨江东路9号',
      star: 5,
      description: '临近府南河畔和339电视塔，配套齐全，适合商务和家庭出行。',
      basePrice: 1280
    },
    {
      name: '成都尼依格罗酒店',
      nameEn: 'Niccolo Chengdu',
      address: '锦江区红星路三段1号',
      star: 5,
      description: '位于国际金融中心上方，高楼层景观出众，直通太古里与远洋太古里商圈。',
      basePrice: 1880
    },
    {
      name: '成都首座万丽酒店',
      nameEn: 'Renaissance Chengdu Hotel',
      address: '高新区天府大道北段59号',
      star: 5,
      description: '位于天府新区商务核心，周边写字楼和购物中心林立，交通便利。',
      basePrice: 980
    }
  ],
  重庆: [
    {
      name: '重庆来福士洲际酒店',
      nameEn: 'InterContinental Chongqing Raffles City',
      address: '渝中区朝千路2号',
      star: 5,
      description: '坐落于朝天门来福士综合体内，可俯瞰两江交汇夜景，打卡感极强。',
      basePrice: 1580
    },
    {
      name: '重庆丽晶酒店',
      nameEn: 'Regent Chongqing',
      address: '江北区江北嘴北滨二路29号',
      star: 5,
      description: '位于江北嘴商务区，江景房可欣赏嘉陵江夜景，适合商务与度假。',
      basePrice: 1480
    },
    {
      name: '重庆解放碑威斯汀酒店',
      nameEn: 'The Westin Chongqing Liberation Square',
      address: '渝中区民族路222号',
      star: 5,
      description: '紧邻解放碑步行街，逛街与品尝重庆地道火锅都非常方便。',
      basePrice: 1180
    },
    {
      name: '重庆玛雅海岸酒店',
      nameEn: 'Chongqing Maya Island Hotel',
      address: '北碚区缙云路16号',
      star: 5,
      description: '依山傍水的度假型酒店，远离市区喧嚣，适合周末休闲度假。',
      basePrice: 880
    },
    {
      name: '重庆悦榕庄',
      nameEn: 'Banyan Tree Chongqing Beibei',
      address: '北碚区北温泉公园内',
      star: 5,
      description: '温泉度假主题酒店，客房带私汤泡池，适合情侣与家庭度假。',
      basePrice: 1880
    }
  ],
  西安: [
    {
      name: '西安索菲特人民大厦酒店',
      nameEn: 'Sofitel Xian on Renmin Square',
      address: '新城区东新街319号',
      star: 5,
      description: '坐落于市中心人民广场附近，周边老城氛围浓厚，出行方便。',
      basePrice: 980
    },
    {
      name: '西安香格里拉大酒店',
      nameEn: 'Shangri-La Hotel Xian',
      address: '雁塔区科技路38号',
      star: 5,
      description: '位于高新区核心地带，适合商务出行，驾车前往大雁塔等景点较为方便。',
      basePrice: 1080
    },
    {
      name: '西安曲江国际会议中心索菲特酒店',
      nameEn: 'Sofitel Legend People\'s Grand Hotel Xian',
      address: '雁塔区慈恩东路与芙蓉西路交汇处',
      star: 5,
      description: '邻近曲江新区及大雁塔景区，会议与休闲配套齐全。',
      basePrice: 1380
    },
    {
      name: '西安万丽酒店',
      nameEn: 'Renaissance Xi\'an Hotel',
      address: '雁塔区太白南路336号',
      star: 5,
      description: '靠近高校与科技园区，整体设计现代，适合商务与差旅。',
      basePrice: 880
    },
    {
      name: '西安浐灞艾美酒店',
      nameEn: 'Le Méridien Xian Chanba',
      address: '浐灞生态区世博大道6号',
      star: 5,
      description: '位于浐灞生态区，周边环境清幽，适合会议与度假。',
      basePrice: 780
    }
  ],
  南京: [
    {
      name: '南京金鹰尚美国际酒店',
      nameEn: 'Jinling Hotel Nanjing',
      address: '鼓楼区汉中路2号',
      star: 5,
      description: '位于新街口商圈核心位置，周边购物与地铁出行十分方便，是南京老牌地标酒店之一。',
      basePrice: 980
    },
    {
      name: '南京香格里拉大酒店',
      nameEn: 'Shangri-La Hotel Nanjing',
      address: '鼓楼区中央路329号',
      star: 5,
      description: '临近玄武湖与地铁站，高区客房可欣赏湖景及城市景观。',
      basePrice: 1080
    },
    {
      name: '南京金奥费尔蒙酒店',
      nameEn: 'Fairmont Nanjing',
      address: '建邺区江东中路333号',
      star: 5,
      description: '坐落于奥体中心附近，建筑造型独特，靠近河西新城商务区。',
      basePrice: 1180
    },
    {
      name: '南京青奥城威斯汀酒店',
      nameEn: 'The Westin Nanjing Resort & Spa',
      address: '建邺区扬子江大道8号',
      star: 5,
      description: '濒临长江，配套亲子与休闲设施，适合周末度假与亲子游。',
      basePrice: 880
    },
    {
      name: '南京钟山高尔夫酒店',
      nameEn: 'Sofitel Nanjing Zhongshan Golf Resort',
      address: '玄武区宁镇公路9号',
      star: 5,
      description: '环绕高尔夫球场与山景，环境清幽，适合度假与团建。',
      basePrice: 980
    }
  ]
};

// 确保有一个可用的商户账号，返回 merchantId
async function ensureMerchant(connection) {
  const [existing] = await connection.execute(
    'SELECT id FROM users WHERE username = ? LIMIT 1',
    ['merchant']
  );

  if (existing.length > 0) {
    return existing[0].id;
  }

  const merchantId = randomUUID();
  const hashedPassword = await bcrypt.hash('merchant123', 10);

  await connection.execute(
    'INSERT INTO users (id, username, password, role, nickname, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
    [merchantId, 'merchant', hashedPassword, 'merchant', '测试商户']
  );

  console.log('✅ 已自动创建测试商户账号 merchant / merchant123');
  return merchantId;
}

async function createCityHotels() {
  const connection = await pool.getConnection();

  try {
    console.log('开始为每个城市创建 5 家酒店测试数据...');

    const merchantId = await ensureMerchant(connection);

    for (const city of CITY_LIST) {
      const list = CITY_HOTELS[city] || [];
      if (!list.length) {
        console.log(`城市 ${city} 暂无预设酒店数据，跳过。`);
        continue;
      }

      console.log(`\n城市：${city}，计划创建 ${list.length} 家酒店`);

      for (const hotel of list) {
        // 避免重复插入：按“城市 + 酒店名称”去重
        const [exists] = await connection.execute(
          'SELECT id FROM hotels WHERE city = ? AND name = ? LIMIT 1',
          [city, hotel.name]
        );

        if (exists.length > 0) {
          console.log(`  ⚠️ 酒店已存在，跳过：${city} - ${hotel.name}`);
          continue;
        }

        const id = randomUUID();

        // 默认房型（便于前端价格展示），价格取城市酒店配置的 basePrice
        const roomTypes = JSON.stringify([
          {
            name: '高级大床房',
            basePrice: hotel.basePrice || 888,
            bedType: '大床',
            maxOccupancy: 2,
            remainingRooms: 20,
            description: '含双人自助早餐，免费停车与 WiFi。'
          },
          {
            name: '豪华双床房',
            basePrice: (hotel.basePrice || 888) + 200,
            bedType: '双床',
            maxOccupancy: 3,
            remainingRooms: 15,
            description: '适合亲子与朋友出行，含自助早与儿童游乐区使用权益。'
          }
        ]);

        const nearbyAttractions = JSON.stringify([]);
        const nearbyTransport = JSON.stringify([]);
        const nearbyMalls = JSON.stringify([]);
        const discounts = JSON.stringify([]);

        await connection.execute(
          `INSERT INTO hotels (
            id,
            name,
            nameEn,
            city,
            address,
            star,
            openDate,
            status,
            merchantId,
            description,
            freeParking,
            freeWifi,
            breakfastType,
            familyFriendly,
            petsAllowed,
            roomTypes,
            nearbyAttractions,
            nearbyTransport,
            nearbyMalls,
            discounts,
            createdAt,
            updatedAt
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW()
          )`,
          [
            id,
            hotel.name,
            hotel.nameEn || null,
            city,
            hotel.address,
            hotel.star || 4,
            '2020-01-01',
            'published',
            merchantId,
            hotel.description || `${city}优质酒店，支持免费停车、免费WiFi与自助早餐。`,
            1, // freeParking
            1, // freeWifi
            'buffet', // 早餐类型：自助早
            1, // familyFriendly
            1, // petsAllowed
            roomTypes,
            nearbyAttractions,
            nearbyTransport,
            nearbyMalls,
            discounts
          ]
        );

        console.log(`  ✅ 已创建酒店：${city} - ${hotel.name}`);
      }
    }

    console.log('\n🎉 所有城市酒店测试数据创建完成！');
  } catch (error) {
    console.error('❌ 创建城市酒店测试数据失败：', error.message);
    throw error;
  } finally {
    connection.release();
  }
}

// 直接运行脚本时执行
if (require.main === module) {
  createCityHotels()
    .then(() => {
      console.log('脚本执行完成。');
      process.exit(0);
    })
    .catch((err) => {
      console.error('脚本执行出错：', err);
      process.exit(1);
    });
}

module.exports = {
  createCityHotels
};

