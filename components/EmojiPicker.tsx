'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Search, Clock, X, Sparkles, Command } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/lib/i18n';

// Emoji 分类数据结构
export interface EmojiCategory {
  id: string;
  name: string;
  nameEn: string;
  emojis: string[];
}

import { PINYIN_MAP } from '@/lib/pinyin-map';

// 获取拼音（支持多音字简单处理）
function getPinyin(char: string): string {
  return PINYIN_MAP[char] || '';
}

// 检查搜索词是否匹配拼音
function matchesPinyin(tag: string, query: string): boolean {
  // 直接包含
  if (tag.toLowerCase().includes(query.toLowerCase())) return true;
  
  // 拼音匹配
  let pinyinStr = '';
  for (const char of tag) {
    const py = getPinyin(char);
    if (py) {
      pinyinStr += py;
    } else {
      pinyinStr += char;
    }
  }
  
  return pinyinStr.toLowerCase().includes(query.toLowerCase());
}

// 简化的 Emoji 搜索标签映射（中英文）
export const EMOJI_TAGS: Record<string, string[]> = {
  // 工作学习
  '💼': ['工作', 'work', '公文包', 'briefcase'],
  '💻': ['电脑', 'computer', '笔记本', 'laptop'],
  '📱': ['手机', 'phone', 'mobile'],
  '💡': ['灵感', 'idea', '灯泡', 'light'],
  '🔥': ['火热', 'fire', '热情'],
  '⭐': ['星星', 'star', '收藏'],
  '🌟': ['闪亮', 'glowing', 'star'],
  '✨': ['闪光', 'sparkles', '魔法'],
  '🎯': ['目标', 'target', '靶心', 'goal', '飞镖', 'dart'],
  '🚀': ['火箭', 'rocket', '发射', '起飞', '太空'],
  '✏️': ['铅笔', 'pencil', '编辑'],
  '📝': ['笔记', 'memo', '记录'],
  '📖': ['书', 'book', '阅读'],
  '📚': ['书籍', 'books', '学习'],
  '🎓': ['毕业', 'graduate', '学位'],
  '🏫': ['学校', 'school', '教育'],
  '📊': ['图表', 'chart', '数据'],
  '📈': ['上升', 'up', '增长'],
  '📉': ['下降', 'down', '下跌'],
  '📋': ['清单', 'clipboard', '任务'],
  
  // 家庭关系
  '👨‍👩‍👧‍👦': ['家庭', 'family', '家人'],
  '👥': ['人群', 'people', '团队'],
  '❤️': ['爱心', 'heart', '爱', '喜欢'],
  '💕': ['两颗心', 'hearts', '爱情'],
  '💖': ['闪亮的心', 'sparkling', 'heart'],
  '💙': ['蓝心', 'blue', 'heart'],
  '💚': ['绿心', 'green', 'heart'],
  '💛': ['黄心', 'yellow', 'heart'],
  '💜': ['紫心', 'purple', 'heart'],
  '🤎': ['棕心', 'brown', 'heart'],
  '👶': ['婴儿', 'baby', '宝宝'],
  '👧': ['女孩', 'girl'],
  '🧒': ['儿童', 'child'],
  '👦': ['男孩', 'boy'],
  '👩': ['女人', 'woman', '女性'],
  '👨': ['男人', 'man', '男性'],
  '🧑': ['成人', 'person'],
  '👴': ['老人', 'old', '爷爷'],
  '👵': ['老奶奶', 'grandma'],
  '🧓': ['长者', 'older'],
  
  // 健康运动
  '💪': ['强壮', 'muscle', '力量', '健身'],
  '🏃': ['跑步', 'running', '运动'],
  '🚶': ['走路', 'walking', '步行'],
  '💊': ['药', 'pill', '药物'],
  '🏥': ['医院', 'hospital', '医疗'],
  '👨‍⚕️': ['男医生', 'doctor', '医生'],
  '👩‍⚕️': ['女医生', 'nurse', '护士'],
  '🧘': ['冥想', 'meditation', '瑜伽'],
  '🧘‍♂️': ['男瑜伽', 'meditation'],
  '🧘‍♀️': ['女瑜伽', 'meditation'],
  '🏋️': ['举重', 'weightlifting', '健身'],
  '🏋️‍♂️': ['男举重', 'weightlifting'],
  '🏋️‍♀️': ['女举重', 'weightlifting'],
  '🚴': ['骑车', 'biking', '自行车'],
  '🚴‍♂️': ['男骑车', 'biking'],
  '🚴‍♀️': ['女骑车', 'biking'],
  '🏊': ['游泳', 'swimming'],
  '🏊‍♂️': ['男游泳', 'swimming'],
  '🏊‍♀️': ['女游泳', 'swimming'],
  '⛹️': ['篮球', 'basketball', '打球'],
  '🤸': ['体操', 'gymnastics'],
  '🤾': ['手球', 'handball'],
  '🧗': ['攀岩', 'climbing', '登山'],
  '🤺': ['击剑', 'fencing'],
  '🏌️': ['高尔夫', 'golf'],
  '🏇': ['赛马', 'horse', 'racing'],
  '⛷️': ['滑雪', 'skiing', 'ski'],
  '🏂': ['单板滑雪', 'snowboard'],
  '🏄': ['冲浪', 'surfing', 'surf'],
  '💆': ['按摩', 'massage'],
  '💇': ['理发', 'haircut'],
  
  // 天气自然
  '🌤️': ['多云', 'sun', 'cloud'],
  '☀️': ['太阳', 'sun', '晴天', '阳光'],
  '🌙': ['月亮', 'moon', '夜晚'],
  '☁️': ['云', 'cloud', '多云'],
  '⛅': ['多云转晴', 'sun', 'cloud'],
  '🌧️': ['下雨', 'rain', '雨天'],
  '⛈️': ['雷雨', 'storm', '雷阵雨'],
  '❄️': ['雪花', 'snow', '下雪'],
  '🌨️': ['下雪', 'snowing'],
  '💨': ['风', 'wind', '刮风'],
  '💧': ['水滴', 'droplet', '水'],
  '☔': ['雨伞', 'umbrella', '雨'],
  '🌈': ['彩虹', 'rainbow'],
  '⚡': ['闪电', 'lightning', '雷电'],
  '🌊': ['海浪', 'wave', '大海'],
  '🌍': ['地球', 'earth', '世界', '欧洲'],
  '🌎': ['地球', 'earth', '美洲'],
  '🌏': ['地球', 'earth', '亚洲'],
  '🌋': ['火山', 'volcano', '喷发'],
  '⛰️': ['山', 'mountain', '山峰'],
  '🏔️': ['雪山', 'snow', 'mountain'],
  '🗻': ['富士山', 'fuji', '日本'],
  '🏕️': ['露营', 'camping', '帐篷'],
  '🏖️': ['海滩', 'beach', '沙滩'],
  '🏜️': ['沙漠', 'desert'],
  '🌵': ['仙人掌', 'cactus'],
  '🎄': ['圣诞树', 'christmas'],
  '🌲': ['松树', 'tree'],
  '🌳': ['树', 'tree'],
  '🌴': ['棕榈树', 'palm'],
  '🌱': ['幼苗', 'seedling'],
  '🌿': ['草药', 'herb'],
  '☘️': ['三叶草', 'shamrock'],
  '🍀': ['四叶草', 'clover', '幸运'],
  '🍁': ['枫叶', 'maple'],
  '🍂': ['落叶', 'fallen', 'leaf'],
  '🍃': ['叶子', 'leaf'],
  '🌷': ['郁金香', 'tulip'],
  '🌹': ['玫瑰', 'rose', '爱情'],
  '🥀': ['枯萎', 'wilted'],
  '🌺': ['芙蓉', 'hibiscus'],
  '🌸': ['樱花', 'cherry', 'blossom'],
  '🌼': ['开花', 'blossom'],
  '🌻': ['向日葵', 'sunflower'],
  '💐': ['花束', 'bouquet', '鲜花'],
  
  // 饮食
  '🍜': ['面条', 'noodles', '拉面'],
  '☕': ['咖啡', 'coffee', '热饮'],
  '🍵': ['茶', 'tea', '绿茶'],
  '🧃': ['果汁', 'juice', '饮料'],
  '🥤': ['饮料', 'cup', '奶茶'],
  '🍺': ['啤酒', 'beer', '酒'],
  '🍷': ['红酒', 'wine', '葡萄酒'],
  '🥂': ['干杯', 'cheers', '香槟'],
  '🍽️': ['餐具', 'fork', 'knife'],
  '🍴': ['刀叉', 'fork', 'knife'],
  '🥄': ['勺子', 'spoon'],
  '🔪': ['刀', 'knife'],
  '🍏': ['青苹果', 'green', 'apple'],
  '🍎': ['苹果', 'apple'],
  '🍐': ['梨', 'pear'],
  '🍊': ['橘子', 'tangerine'],
  '🍋': ['柠檬', 'lemon'],
  '🍌': ['香蕉', 'banana'],
  '🍉': ['西瓜', 'watermelon'],
  '🍇': ['葡萄', 'grapes'],
  '🍓': ['草莓', 'strawberry'],
  '🫐': ['蓝莓', 'blueberry'],
  '🍈': ['甜瓜', 'melon'],
  '🍒': ['樱桃', 'cherries'],
  '🍑': ['桃子', 'peach'],
  '🍍': ['菠萝', 'pineapple'],
  '🥝': ['猕猴桃', 'kiwi'],
  '🍅': ['番茄', 'tomato'],
  '🥑': ['牛油果', 'avocado'],
  '🍆': ['茄子', 'eggplant'],
  '🥔': ['土豆', 'potato'],
  '🥕': ['胡萝卜', 'carrot'],
  '🌽': ['玉米', 'corn'],
  '🌶️': ['辣椒', 'pepper', 'hot'],
  '🥒': ['黄瓜', 'cucumber'],
  '🥬': ['绿叶菜', 'leafy', 'green'],
  '🥦': ['西兰花', 'broccoli'],
  '🧄': ['大蒜', 'garlic'],
  '🧅': ['洋葱', 'onion'],
  '🍄': ['蘑菇', 'mushroom'],
  '🥜': ['花生', 'peanuts'],
  '🌰': ['栗子', 'chestnut'],
  '🍞': ['面包', 'bread'],
  '🥐': ['牛角包', 'croissant'],
  '🥖': ['法棍', 'baguette'],
  '🥨': ['椒盐卷饼', 'pretzel'],
  '🥯': ['百吉饼', 'bagel'],
  '🥞': ['煎饼', 'pancakes'],
  '🧇': ['华夫饼', 'waffle'],
  '🧀': ['奶酪', 'cheese', '芝士'],
  '🍖': ['肉', 'meat', '骨头'],
  '🍗': ['鸡腿', 'poultry', 'leg'],
  '🥩': ['牛排', 'steak', 'meat'],
  '🥓': ['培根', 'bacon'],
  '🍔': ['汉堡', 'hamburger', 'burger'],
  '🍟': ['薯条', 'fries'],
  '🍕': ['披萨', 'pizza'],
  '🌭': ['热狗', 'hotdog'],
  '🥪': ['三明治', 'sandwich'],
  '🌮': ['墨西哥卷', 'taco'],
  '🌯': ['卷饼', 'burrito'],
  '🥙': ['皮塔饼', 'stuffed'],
  '🧆': ['炸豆丸子', 'falafel'],
  '🥚': ['鸡蛋', 'egg'],
  '🍳': ['煎蛋', 'cooking'],
  '🥘': ['炖菜', 'paella'],
  '🍲': ['汤', 'pot', '火锅'],
  '🥣': ['碗', 'bowl'],
  '🥗': ['沙拉', 'green', 'salad'],
  '🍿': ['爆米花', 'popcorn'],
  '🧈': ['黄油', 'butter'],
  '🧂': ['盐', 'salt'],
  '🥫': ['罐头', 'canned'],
  '🍱': ['便当', 'bento', '盒饭'],
  '🍘': ['米饼', 'rice', 'cracker'],
  '🍙': ['饭团', 'rice', 'ball'],
  '🍚': ['米饭', 'rice'],
  '🍛': ['咖喱饭', 'curry', 'rice'],
  '🍝': ['意大利面', 'spaghetti'],
  '🍠': ['红薯', 'sweet', 'potato'],
  '🍢': ['关东煮', 'oden'],
  '🍣': ['寿司', 'sushi', '生鱼片'],
  '🍤': ['天妇罗', 'fried', 'shrimp'],
  '🍥': ['鱼板', 'fish', 'cake'],
  '🍡': ['团子', 'dango'],
  '🍦': ['冰淇淋', 'ice', 'cream'],
  '🍧': ['刨冰', 'shaved', 'ice'],
  '🍨': ['冰淇淋', 'ice', 'cream'],
  '🍩': ['甜甜圈', 'doughnut', 'donut'],
  '🍪': ['饼干', 'cookie', '曲奇'],
  '🎂': ['蛋糕', 'birthday', 'cake'],
  '🍰': ['蛋糕', 'shortcake'],
  '🧁': ['纸杯蛋糕', 'cupcake'],
  '🥧': ['派', 'pie'],
  '🍫': ['巧克力', 'chocolate'],
  '🍬': ['糖果', 'candy'],
  '🍭': ['棒棒糖', 'lollipop'],
  '🍮': ['布丁', 'custard'],
  '🍯': ['蜂蜜', 'honey'],
  '🍼': ['奶瓶', 'baby', 'bottle'],
  '🥛': ['牛奶', 'milk'],
  '🫖': ['茶壶', 'teapot'],
  '🍶': ['清酒', 'sake'],
  '🍾': ['香槟', 'champagne'],
  '🍸': ['鸡尾酒', 'cocktail'],
  '🍹': ['热带饮料', 'tropical', 'drink'],
  '🍻': ['干杯', 'beers'],
  '🥃': ['威士忌', 'whisky'],
  '🧋': ['珍珠奶茶', 'bubble', 'tea', '奶茶'],
  '🧉': ['马黛茶', 'mate'],
  '🧊': ['冰块', 'ice'],
  '🥢': ['筷子', 'chopsticks'],
  '🏺': ['陶罐', 'amphora'],
  
  // 娱乐爱好
  '🎨': ['艺术', 'art', '绘画'],
  '📷': ['相机', 'camera', '拍照'],
  '🎮': ['游戏', 'video', 'game'],
  '🎵': ['音乐', 'music', '音符'],
  '🎬': ['电影', 'clapper', 'film'],
  '🎤': ['麦克风', 'microphone', '唱歌'],
  '🎧': ['耳机', 'headphone'],
  '🎹': ['钢琴', 'musical', 'keyboard'],
  '🥁': ['鼓', 'drum'],
  '🎷': ['萨克斯', 'saxophone'],
  '🎺': ['小号', 'trumpet'],
  '🎸': ['吉他', 'guitar'],
  '🎻': ['小提琴', 'violin'],
  '🎲': ['骰子', 'die', 'game'],
  '🎳': ['保龄球', 'bowling'],
  '🎰': ['老虎机', 'slot', 'machine'],
  '🕹️': ['游戏手柄', 'joystick'],
  '🎴': ['花牌', 'flower', 'cards'],
  '🎪': ['马戏团', 'circus'],
  '🎭': ['戏剧', 'performing', 'arts'],
  '🎼': ['乐谱', 'musical', 'score'],
  '📺': ['电视', 'television', 'tv'],
  '📻': ['收音机', 'radio'],
  '⌨️': ['键盘', 'keyboard'],
  '🖥️': ['台式电脑', 'desktop'],
  '🖨️': ['打印机', 'printer'],
  '🖱️': ['鼠标', 'mouse'],
  '🖲️': ['轨迹球', 'trackball'],
  '🗜️': ['夹钳', 'clamp'],
  '💽': ['迷你光盘', 'minidisc'],
  '💾': ['软盘', 'floppy', 'disk'],
  '💿': ['光盘', 'optical', 'disk'],
  '📀': ['DVD', 'dvd'],
  '📼': ['录像带', 'videocassette'],
  '📸': ['闪光灯相机', 'camera', 'flash'],
  '📹': ['摄像机', 'video', 'camera'],
  '🎥': ['电影摄像机', 'movie', 'camera'],
  '📽️': ['电影放映机', 'film', 'projector'],
  '🎞️': ['电影胶片', 'film'],
  '📞': ['电话听筒', 'telephone'],
  '☎️': ['电话', 'telephone'],
  '📟': ['寻呼机', 'pager'],
  '📠': ['传真机', 'fax'],
  '🎙️': ['录音室麦克风', 'studio', 'microphone'],
  '🎚️': ['调音台', 'level', 'slider'],
  '🎛️': ['控制旋钮', 'control', 'knobs'],
  '🧭': ['指南针', 'compass'],
  '⏱️': ['秒表', 'stopwatch'],
  '⏲️': ['定时器', 'timer'],
  '⏰': ['闹钟', 'alarm', 'clock'],
  '🕰️': ['座钟', 'mantelpiece'],
  '⌛': ['沙漏', 'hourglass'],
  '⏳': ['沙漏', 'hourglass'],
  '📡': ['卫星天线', 'satellite'],
  '🔋': ['电池', 'battery'],
  '🔌': ['插头', 'electric', 'plug'],
  '🔦': ['手电筒', 'flashlight'],
  '🕯️': ['蜡烛', 'candle'],
  '🪔': ['油灯', 'diya', 'lamp'],
  '🧯': ['灭火器', 'fire', 'extinguisher'],
  '🛢️': ['油桶', 'oil', 'drum'],
  '💸': ['钱飞走', 'money', 'wings'],
  '💵': ['美元', 'dollar'],
  '💴': ['日元', 'yen'],
  '💶': ['欧元', 'euro'],
  '💷': ['英镑', 'pound'],
  '🪙': ['硬币', 'coin'],
  '💰': ['钱袋', 'money', 'bag'],
  '💳': ['信用卡', 'credit', 'card'],
  '💎': ['钻石', 'gem', 'stone'],
  '⚖️': ['天平', 'balance', 'scale'],
  '🪜': ['梯子', 'ladder'],
  '🧰': ['工具箱', 'toolbox'],
  '🪛': ['螺丝刀', 'screwdriver'],
  '🔧': ['扳手', 'wrench'],
  '🔨': ['锤子', 'hammer'],
  '⚒️': ['锤子和镐', 'hammer', 'pick'],
  '🛠️': ['锤子和扳手', 'hammer', 'wrench'],
  '⛏️': ['镐', 'pick'],
  '🪚': ['锯子', 'carpentry', 'saw'],
  '🔩': ['螺母螺栓', 'nut', 'bolt'],
  '🗡️': ['匕首', 'dagger'],
  '⚔️': ['交叉剑', 'crossed', 'swords'],
  '🔫': ['水枪', 'water', 'pistol'],
  '🪃': ['回旋镖', 'boomerang'],
  '🏹': ['弓箭', 'bow', 'arrow'],
  '🛡️': ['盾牌', 'shield'],
  
  // 动物
  '🐶': ['狗', 'dog', '小狗', 'pet'],
  '🐱': ['猫', 'cat', '小猫'],
  '🐰': ['兔子', 'rabbit', 'bunny'],
  '🦊': ['狐狸', 'fox'],
  '🐻': ['熊', 'bear'],
  '🐼': ['熊猫', 'panda'],
  '🐨': ['考拉', 'koala'],
  '🐯': ['老虎', 'tiger'],
  '🦁': ['狮子', 'lion'],
  '🐮': ['牛', 'cow'],
  '🐷': ['猪', 'pig'],
  '🐸': ['青蛙', 'frog'],
  '🐵': ['猴子', 'monkey'],
  '🐔': ['鸡', 'chicken'],
  '🐧': ['企鹅', 'penguin'],
  '🐦': ['鸟', 'bird'],
  '🐤': ['小鸡', 'baby', 'chick'],
  '🦆': ['鸭子', 'duck'],
  '🦅': ['鹰', 'eagle'],
  '🦉': ['猫头鹰', 'owl'],
  '🦇': ['蝙蝠', 'bat'],
  '🐺': ['狼', 'wolf'],
  '🐗': ['野猪', 'boar'],
  '🐴': ['马', 'horse'],
  '🦄': ['独角兽', 'unicorn'],
  '🐝': ['蜜蜂', 'honeybee'],
  '🐛': ['虫子', 'bug'],
  '🦋': ['蝴蝶', 'butterfly'],
  '🐌': ['蜗牛', 'snail'],
  '🐞': ['瓢虫', 'lady', 'beetle'],
  '🐜': ['蚂蚁', 'ant'],
  '🦟': ['蚊子', 'mosquito'],
  '🦗': ['蟋蟀', 'cricket'],
  '🕷️': ['蜘蛛', 'spider'],
  '🕸️': ['蜘蛛网', 'spider', 'web'],
  '🦂': ['蝎子', 'scorpion'],
  '🐢': ['乌龟', 'turtle'],
  '🐍': ['蛇', 'snake'],
  '🦎': ['蜥蜴', 'lizard'],
  '🦖': ['霸王龙', 't-rex', '恐龙'],
  '🦕': ['恐龙', 'sauropod'],
  '🐙': ['章鱼', 'octopus'],
  '🦑': ['乌贼', 'squid'],
  '🦐': ['虾', 'shrimp'],
  '🦞': ['龙虾', 'lobster'],
  '🦀': ['螃蟹', 'crab'],
  '🐡': ['河豚', 'blowfish'],
  '🐠': ['热带鱼', 'tropical', 'fish'],
  '🐟': ['鱼', 'fish'],
  '🐬': ['海豚', 'dolphin'],
  '🐳': ['鲸鱼', 'whale'],
  '🐋': ['鲸鱼', 'whale'],
  '🦈': ['鲨鱼', 'shark'],
  '🐊': ['鳄鱼', 'crocodile'],
  '🐅': ['老虎', 'tiger'],
  '🐆': ['豹子', 'leopard'],
  '🦓': ['斑马', 'zebra'],
  '🦍': ['大猩猩', 'gorilla'],
  '🦧': ['红毛猩猩', 'orangutan'],
  '🐘': ['大象', 'elephant'],
  '🦛': ['河马', 'hippopotamus'],
  '🦏': ['犀牛', 'rhinoceros'],
  '🐪': ['骆驼', 'camel'],
  '🐫': ['双峰骆驼', 'two-hump'],
  '🦒': ['长颈鹿', 'giraffe'],
  '🦘': ['袋鼠', 'kangaroo'],
  '🐃': ['水牛', 'water', 'buffalo'],
  '🐂': ['公牛', 'ox'],
  '🐄': ['奶牛', 'cow'],
  '🐎': ['马', 'horse'],
  '🐖': ['猪', 'pig'],
  '🐏': ['公羊', 'ram'],
  '🐑': ['绵羊', 'ewe'],
  '🦙': ['羊驼', 'llama'],
  '🐐': ['山羊', 'goat'],
  '🦌': ['鹿', 'deer'],
  '🐕': ['狗', 'dog'],
  '🐩': ['贵宾犬', 'poodle'],
  '🦮': ['导盲犬', 'guide', 'dog'],
  '🐈': ['猫', 'cat'],
  '🐓': ['公鸡', 'rooster'],
  '🦃': ['火鸡', 'turkey'],
  '🕊️': ['鸽子', 'dove', '和平'],
  '🐇': ['兔子', 'rabbit'],
  '🦝': ['浣熊', 'raccoon'],
  '🦨': ['臭鼬', 'skunk'],
  '🦡': ['獾', 'badger'],
  '🦦': ['水獭', 'otter'],
  '🦥': ['树懒', 'sloth'],
  '🐁': ['老鼠', 'mouse'],
  '🐀': ['耗子', 'rat'],
  '🐿️': ['松鼠', 'chipmunk'],
  '🦔': ['刺猬', 'hedgehog'],
  '🐾': ['爪印', 'paw', 'prints'],
  '🐉': ['龙', 'dragon'],
  '🐲': ['龙头', 'dragon', 'face'],
  
  // 交通出行
  '🏠': ['房子', 'house', '家'],
  '🚗': ['汽车', 'car', '轿车'],
  '🚕': ['出租车', 'taxi', '的士'],
  '🚙': ['越野车', 'suv'],
  '🚌': ['公交车', 'bus'],
  '🚎': ['无轨电车', 'trolleybus'],
  '🏎️': ['赛车', 'racing', 'car'],
  '🚓': ['警车', 'police', 'car'],
  '🚑': ['救护车', 'ambulance'],
  '🚒': ['消防车', 'fire', 'engine'],
  '🚐': ['面包车', 'minibus'],
  '🛻': ['皮卡车', 'pickup'],
  '🚚': ['货车', 'delivery', 'truck'],
  '🚛': ['铰接式货车', 'articulated'],
  '🚜': ['拖拉机', 'tractor'],
  '🦯': ['盲杖', 'white', 'cane'],
  '🦽': ['手动轮椅', 'manual', 'wheelchair'],
  '🦼': ['电动轮椅', 'motorized'],
  '🛴': ['滑板车', 'kick', 'scooter'],
  '🚲': ['自行车', 'bicycle', '单车'],
  '🛵': ['摩托车', 'motor', 'scooter'],
  '🏍️': ['摩托车', 'motorcycle'],
  '🛺': ['三轮车', 'auto', 'rickshaw'],
  '🚨': ['警灯', 'police', 'light'],
  '🚔': ['警车', 'oncoming', 'police'],
  '🚍': ['迎面巴士', 'oncoming', 'bus'],
  '🚘': ['迎面汽车', 'oncoming'],
  '🚖': ['迎面出租车', 'oncoming', 'taxi'],
  '🚡': ['缆车', 'aerial', 'tramway'],
  '🚠': ['山地缆车', 'mountain'],
  '🚟': ['悬挂铁路', 'suspension'],
  '🚃': ['轨道车', 'railway', 'car'],
  '🚋': ['有轨电车', 'tram'],
  '🚞': ['山地铁路', 'mountain'],
  '🚝': ['单轨', 'monorail'],
  '🚄': ['高铁', 'high-speed', 'train'],
  '🚅': ['子弹头列车', 'bullet', 'train'],
  '🚈': ['轻轨', 'light', 'rail'],
  '🚂': ['蒸汽火车', 'steam', 'locomotive'],
  '🚆': ['火车', 'train'],
  '🚇': ['地铁', 'metro', 'subway'],
  '🚊': ['电车', 'tram'],
  '🚉': ['车站', 'station'],
  '✈️': ['飞机', 'airplane', '航班'],
  '🛫': ['起飞', 'departure'],
  '🛬': ['降落', 'arrival'],
  '🛩️': ['小飞机', 'small', 'airplane'],
  '💺': ['座位', 'seat'],
  '🛰️': ['卫星', 'satellite'],
  '🛸': ['飞碟', 'flying', 'saucer', 'ufo'],
  '🚁': ['直升机', 'helicopter'],
  '🛶': ['独木舟', 'canoe'],
  '⛵': ['帆船', 'sailboat'],
  '🚤': ['快艇', 'speedboat'],
  '🛥️': ['汽艇', 'motor', 'boat'],
  '🛳️': ['客轮', 'passenger', 'ship'],
  '⛴️': ['渡轮', 'ferry'],
  '🚢': ['轮船', 'ship'],
  '⚓': ['锚', 'anchor'],
  '⛽': ['加油站', 'fuel', 'pump'],
  '🚧': ['施工', 'construction'],
  '🚦': ['红绿灯', 'traffic', 'light'],
  '🚥': ['红绿灯', 'traffic', 'light'],
  '🚏': ['公交站', 'bus', 'stop'],
  '🗺️': ['世界地图', 'world', 'map'],
  '🗿': ['摩艾石像', 'moai'],
  '🗽': ['自由女神像', 'statue', 'liberty'],
  '🗼': ['东京塔', 'tokyo', 'tower'],
  '🏰': ['城堡', 'castle'],
  '🏯': ['日本城堡', 'japanese', 'castle'],
  '🏟️': ['体育场', 'stadium'],
  '🎡': ['摩天轮', 'ferris', 'wheel'],
  '🎢': ['过山车', 'roller', 'coaster'],
  '🎠': ['旋转木马', 'carousel'],
  '⛲': ['喷泉', 'fountain'],
  '⛱️': ['沙滩伞', 'umbrella'],
  '⛺': ['帐篷', 'tent'],
  '🏡': ['别墅', 'house', 'garden'],
  '🏘️': ['房屋群', 'houses'],
  '🏚️': ['废弃房屋', 'derelict'],
  '🏗️': ['建筑工地', 'building'],
  '🏭': ['工厂', 'factory'],
  '🏢': ['办公楼', 'office', 'building'],
  '🏬': ['商场', 'department', 'store'],
  '🏣': ['邮局', 'post', 'office'],
  '🏤': ['欧洲邮局', 'european', 'post'],
  '🏦': ['银行', 'bank'],
  '🏨': ['酒店', 'hotel'],
  '🏪': ['便利店', 'convenience', 'store'],
  '🏩': ['爱情酒店', 'love', 'hotel'],
  '💒': ['婚礼', 'wedding'],
  '🏛️': ['古典建筑', 'classical', 'building'],
  '⛪': ['教堂', 'church'],
  '🕌': ['清真寺', 'mosque'],
  '🕍': ['犹太教堂', 'synagogue'],
  '🛕': ['印度寺庙', 'hindu', 'temple'],
  '🕋': ['克尔白', 'kaaba'],
  '⛩️': ['神社', 'shinto', 'shrine'],
  '🛤️': ['铁轨', 'railway', 'track'],
  '🛣️': ['高速公路', 'motorway'],
  '🗾': ['日本地图', 'map', 'japan'],
  '🎑': ['赏月', 'moon', 'viewing'],
  '🏞️': ['国家公园', 'national', 'park'],
  '🌅': ['日出', 'sunrise'],
  '🌄': ['山间日出', 'sunrise', 'mountains'],
  '🌠': ['流星', 'shooting', 'star'],
  '🎇': ['烟花', 'sparkler'],
  '🎆': ['焰火', 'fireworks'],
  '🌇': ['日落', 'sunset'],
  '🌆': ['城市黄昏', 'cityscape', 'dusk'],
  '🏙️': ['城市景观', 'cityscape'],
  '🌃': ['夜景', 'night', 'stars'],
  '🌌': ['银河', 'milky', 'way'],
  '🌉': ['夜桥', 'bridge', 'night'],
  '🌁': ['雾桥', 'foggy', 'bridge'],
  
  // 情感心情
  '😀': ['笑脸', 'grinning', '开心'],
  '😃': ['大笑', 'grinning', 'big', 'eyes'],
  '😄': ['眯眼笑', 'grinning', 'smiling', 'eyes'],
  '😁': ['露齿笑', 'beaming', 'smiling'],
  '😆': ['眯眼大笑', 'grinning', 'squinting'],
  '😅': ['汗笑', 'grinning', 'sweat'],
  '😂': ['笑哭', 'tears', 'joy'],
  '🤣': ['倒地大笑', 'rolling', 'floor', 'laughing'],
  '😊': ['微笑', 'smiling', 'smiling', 'eyes'],
  '😇': ['天使', 'smiling', 'halo'],
  '🙂': ['淡淡微笑', 'slightly', 'smiling'],
  '🙃': ['颠倒', 'upside-down'],
  '😉': ['眨眼', 'winking'],
  '😌': ['松口气', 'relieved'],
  '😍': ['花痴', 'smiling', 'heart-eyes'],
  '🥰': ['爱心脸', 'smiling', 'hearts'],
  '😘': ['飞吻', 'blowing', 'kiss'],
  '😗': ['亲吻', 'kissing'],
  '😙': ['亲亲', 'kissing', 'smiling'],
  '😚': ['闭眼亲', 'kissing', 'closed', 'eyes'],
  '😋': ['好吃', 'savoring', 'food', 'yum'],
  '😛': ['吐舌', 'tongue'],
  '😝': ['闭眼吐舌', 'squinting', 'tongue'],
  '😜': ['眨眼吐舌', 'winking', 'tongue'],
  '🤪': ['搞怪', 'zany'],
  '🤨': ['挑眉', 'raised', 'eyebrow'],
  '🧐': ['单片眼镜', 'monocle'],
  '🤓': ['书呆子', 'nerd', '眼镜'],
  '😎': ['墨镜', 'smiling', 'sunglasses', '酷'],
  '🥸': ['伪装', 'disguised'],
  '🤩': ['崇拜', 'star-struck'],
  '🥳': ['派对', 'partying', '庆祝'],
  '😏': ['得意', 'smirking'],
  '😒': ['不爽', 'unamused'],
  '😞': ['失望', 'disappointed'],
  '😔': ['沉思', 'pensive'],
  '😟': ['担心', 'worried'],
  '😕': ['困惑', 'confused'],
  '🙁': ['微皱眉', 'slightly', 'frowning'],
  '☹️': ['皱眉', 'frowning', '难过'],
  '😣': ['坚持', 'persevering'],
  '😖': ['纠结', 'confounded'],
  '😫': ['疲惫', 'tired'],
  '😩': ['累瘫', 'weary'],
  '🥺': ['可怜', 'pleading', '求求'],
  '😢': ['哭泣', 'crying'],
  '😭': ['大哭', 'loudly', 'crying', '泪奔'],
  '😤': ['生气', 'steam', 'nose'],
  '😠': ['愤怒', 'angry'],
  '😡': ['怒', 'pouting', '红脸'],
  '🤬': ['咒骂', 'symbols', 'mouth'],
  '🤯': ['爆炸头', 'exploding', 'head'],
  '😳': ['脸红', 'flushed', '害羞'],
  '🥵': ['热', 'hot', '流汗'],
  '🥶': ['冷', 'cold', '冻僵'],
  '😱': ['惊恐', 'screaming', 'fear'],
  '😨': ['害怕', 'fearful'],
  '😰': ['冷汗', 'anxious', 'sweat'],
  '😥': ['失望但放心', 'sad', 'relieved'],
  '😓': ['汗', 'cold', 'sweat'],
  '🤗': ['拥抱', 'hugging'],
  '🤔': ['思考', 'thinking', '想'],
  '🤭': ['捂嘴', 'hand', 'mouth'],
  '🤫': ['嘘', 'shushing', '安静'],
  '🤥': ['说谎', 'lying', '长鼻子'],
  '😶': ['无嘴', 'without', 'mouth', '沉默'],
  '😐': ['中性', 'neutral', '面无表情'],
  '😑': ['无语', 'expressionless'],
  '😬': ['龇牙', 'grimacing'],
  '🙄': ['翻白眼', 'rolling', 'eyes'],
  '😯': ['惊讶', 'hushed'],
  '😦': ['张嘴', 'open', 'mouth'],
  '😧': ['痛苦', 'anguished'],
  '😮': ['吃惊', 'open', 'mouth'],
  '😲': ['震惊', 'astonished'],
  '🥱': ['打哈欠', 'yawning', '困'],
  '😴': ['睡觉', 'sleeping', '睡着'],
  '🤤': ['流口水', 'drooling'],
  '😪': ['困倦', 'sleepy'],
  '😵': ['晕', 'dizzy', 'knockout'],
  '🤐': ['闭嘴', 'zipper-mouth'],
  '🥴': ['醉', 'woozy', '晕乎乎'],
  '🤢': ['恶心', 'nauseated', '想吐'],
  '🤮': ['呕吐', 'vomiting'],
  '🤧': ['打喷嚏', 'sneezing', '感冒'],
  '😷': ['口罩', 'medical', 'mask', '生病'],
  '🤒': ['发烧', 'thermometer'],
  '🤕': ['受伤', 'head-bandage', '绷带'],
  '🤑': ['财迷', 'money-mouth', '钱'],
  '🤠': ['牛仔', 'cowboy', 'hat'],
  '😈': ['恶魔笑', 'smiling', 'horns'],
  '👿': ['恶魔怒', 'angry', 'horns'],
  '👹': ['食人魔', 'ogre', '鬼'],
  '👺': ['小妖精', 'goblin'],
  '🤡': ['小丑', 'clown'],
  '💩': ['便便', 'poo', '屎'],
  '👻': ['鬼', 'ghost', '幽灵'],
  '💀': ['骷髅', 'skull', '头骨'],
  '☠️': ['骷髅头', 'skull', 'crossbones', '海盗'],
  '👽': ['外星人', 'alien', 'et'],
  '👾': ['外星怪物', 'alien', 'monster'],
  '🤖': ['机器人', 'robot'],
  '🎃': ['南瓜灯', 'jack-o-lantern', '万圣节'],
  '😺': ['猫笑脸', 'grinning', 'cat'],
  '😸': ['猫大笑', 'grinning', 'cat'],
  '😹': ['猫笑哭', 'cat', 'tears'],
  '😻': ['猫花痴', 'smiling', 'cat'],
  '😼': ['猫得意', 'cat', 'wry', 'smile'],
  '😽': ['猫亲亲', 'kissing', 'cat'],
  '🙀': ['猫疲倦', 'weary', 'cat'],
  '😿': ['猫哭', 'crying', 'cat'],
  '😾': ['猫怒', 'pouting', 'cat'],
  
  // 物品手势
  '👋': ['挥手', 'waving', 'hand', 'hi'],
  '🤚': ['举手背', 'raised', 'back'],
  '🖐️': ['张开手', 'fingers', 'splayed'],
  '✋': ['举手', 'raised', 'hand'],
  '🖖': ['瓦肯礼', 'vulcan', 'salute'],
  '👌': ['ok', 'ok', 'hand'],
  '🤌': ['捏手指', 'pinched', 'fingers'],
  '🤏': ['捏合', 'pinching', 'hand'],
  '✌️': ['胜利', 'victory', 'hand', '剪刀手'],
  '🤞': ['交叉手指', 'crossed', 'fingers'],
  '🤟': ['爱你', 'love-you', 'gesture'],
  '🤘': ['摇滚', 'horns', 'rock'],
  '🤙': ['打电话', 'call', 'me', 'hand'],
  '👈': ['左指', 'pointing', 'left'],
  '👉': ['右指', 'pointing', 'right'],
  '👆': ['上指', 'pointing', 'up'],
  '🖕': ['中指', 'middle', 'finger'],
  '👇': ['下指', 'pointing', 'down'],
  '☝️': ['食指上', 'pointing', 'up'],
  '👍': ['赞', 'thumbs', 'up', 'good', '好'],
  '👎': ['踩', 'thumbs', 'down', 'bad'],
  '✊': ['握拳', 'raised', 'fist'],
  '👊': ['出拳', 'oncoming', 'fist'],
  '🤛': ['左拳', 'left-facing', 'fist'],
  '🤜': ['右拳', 'right-facing', 'fist'],
  '👏': ['鼓掌', 'clapping', 'hands', '拍手'],
  '🙌': ['举手', 'raising', 'hands', '庆祝'],
  '👐': ['张开双手', 'open', 'hands'],
  '🤲': ['掌心向上', 'palms', 'up'],
  '🤝': ['握手', 'handshake', '合作'],
  '🙏': ['祈祷', 'folded', 'hands', '拜托'],
  '✍️': ['写字', 'writing', 'hand'],
  '💅': ['涂指甲', 'nail', 'polish', '美甲'],
  '🤳': ['自拍', 'selfie', '拍照'],
  '🦾': ['机械臂', 'mechanical', 'arm'],
  '🦿': ['机械腿', 'mechanical', 'leg'],
  '🦵': ['腿', 'leg'],
  '🦶': ['脚', 'foot'],
  '👂': ['耳朵', 'ear'],
  '🦻': ['助听器', 'hearing', 'aid'],
  '👃': ['鼻子', 'nose'],
  '🧠': ['大脑', 'brain', '思考'],
  '🦷': ['牙齿', 'tooth'],
  '🦴': ['骨头', 'bone'],
  '👀': ['眼睛', 'eyes'],
  '👁️': ['眼睛', 'eye'],
  '👅': ['舌头', 'tongue'],
  '👄': ['嘴唇', 'mouth'],
};

// Emoji 分类数据
export const EMOJI_CATEGORIES: EmojiCategory[] = [
  {
    id: 'recent',
    name: '最近使用',
    nameEn: 'Recent',
    emojis: [],
  },
  {
    id: 'work',
    name: '工作学习',
    nameEn: 'Work & Study',
    emojis: ['💼', '💻', '📱', '💡', '🔥', '⭐', '🌟', '✨', '🎯', '🚀', '✏️', '📝', '📖', '📚', '🎓', '🏫', '📊', '📈', '📉', '📋', '⌨️', '🖥️', '🖨️', '📡', '🔋', '🔌'],
  },
  {
    id: 'family',
    name: '家庭关系',
    nameEn: 'Family & Love',
    emojis: ['👨‍👩‍👧‍👦', '👥', '❤️', '💕', '💖', '💙', '💚', '💛', '💜', '🤎', '👶', '👧', '🧒', '👦', '👩', '👨', '🧑', '👴', '👵', '🧓', '👪', '💑', '💏', '👫', '👭', '👬'],
  },
  {
    id: 'health',
    name: '健康运动',
    nameEn: 'Health & Sport',
    emojis: ['💪', '🏃', '🚶', '💊', '🏥', '👨‍⚕️', '👩‍⚕️', '🧘', '🧘‍♂️', '🧘‍♀️', '🏋️', '🏋️‍♂️', '🏋️‍♀️', '🚴', '🚴‍♂️', '🚴‍♀️', '🏊', '🏊‍♂️', '🏊‍♀️', '⛹️', '🤸', '🤾', '🧗', '🤺', '🏌️', '🏇', '⛷️', '🏂', '🏄', '💆', '💇'],
  },
  {
    id: 'weather',
    name: '天气自然',
    nameEn: 'Weather & Nature',
    emojis: ['🌤️', '☀️', '🌙', '⭐', '☁️', '⛅', '🌧️', '⛈️', '❄️', '🌨️', '💨', '💧', '☔', '🌈', '⚡', '🌊', '🌍', '🌎', '🌏', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '🏖️', '🏜️', '🌵', '🎄', '🌲', '🌳', '🌴', '🌱', '🌿', '☘️', '🍀', '🍁', '🍂', '🍃', '🌷', '🌹', '🥀', '🌺', '🌸', '🌼', '🌻', '💐'],
  },
  {
    id: 'food',
    name: '饮食',
    nameEn: 'Food & Drink',
    emojis: ['🍜', '☕', '🍵', '🧃', '🥤', '🍺', '🍷', '🥂', '🍽️', '🍴', '🥄', '🔪', '🍏', '🍎', '🍐', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒', '🍑', '🍍', '🥝', '🍅', '🥑', '🍆', '🥔', '🥕', '🌽', '🌶️', '🥒', '🥬', '🥦', '🧄', '🧅', '🍄', '🥜', '🌰', '🍞', '🥐', '🥖', '🥨', '🥯', '🥞', '🧇', '🧀', '🍖', '🍗', '🥩', '🥓', '🍔', '🍟', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🧆', '🥚', '🍳', '🥘', '🍲', '🥣', '🥗', '🍿', '🧈', '🧂', '🥫', '🍱', '🍘', '🍙', '🍚', '🍛', '🍝', '🍠', '🍢', '🍣', '🍤', '🍥', '🍡', '🍦', '🍧', '🍨', '🍩', '🍪', '🎂', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥛', '🫖', '🍶', '🍾', '🍸', '🍹', '🍻', '🥃', '🧋', '🧉', '🧊', '🥢'],
  },
  {
    id: 'entertainment',
    name: '娱乐爱好',
    nameEn: 'Entertainment',
    emojis: ['🎨', '📷', '🎮', '🎵', '🎬', '🎤', '🎧', '🎹', '🥁', '🎷', '🎺', '🎸', '🎻', '🎲', '🎳', '🎰', '🕹️', '🎴', '🎪', '🎭', '🎼', '📺', '📻', '📼', '📸', '📹', '🎥', '📽️', '🎞️', '🎙️', '🎚️', '🎛️', '🧭', '⏱️', '⏲️', '⏰', '🕰️', '⌛', '⏳'],
  },
  {
    id: 'animals',
    name: '动物',
    nameEn: 'Animals',
    emojis: ['🐶', '🐱', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮', '🐷', '🐸', '🐵', '🐔', '🐧', '🐦', '🐤', '🦆', '🦅', '🦉', '🦇', '🐺', '🐗', '🐴', '🦄', '🐝', '🐛', '🦋', '🐌', '🐞', '🐜', '🦟', '🦗', '🕷️', '🕸️', '🦂', '🐢', '🐍', '🦎', '🦖', '🦕', '🐙', '🦑', '🦐', '🦞', '🦀', '🐡', '🐠', '🐟', '🐬', '🐳', '🐋', '🦈', '🐊', '🐅', '🐆', '🦓', '🦍', '🦧', '🐘', '🦛', '🦏', '🐪', '🐫', '🦒', '🦘', '🐃', '🐂', '🐄', '🐎', '🐖', '🐏', '🐑', '🦙', '🐐', '🦌', '🐕', '🐩', '🦮', '🐈', '🐓', '🦃', '🕊️', '🐇', '🦝', '🦨', '🦡', '🦦', '🦥', '🐁', '🐀', '🐿️', '🦔', '🐾', '🐉', '🐲'],
  },
  {
    id: 'transport',
    name: '交通出行',
    nameEn: 'Transport',
    emojis: ['🏠', '🚗', '🚕', '🚙', '🚌', '🚎', '🏎️', '🚓', '🚑', '🚒', '🚐', '🛻', '🚚', '🚛', '🚜', '🛴', '🚲', '🛵', '🏍️', '🛺', '🚨', '🚔', '🚍', '🚘', '🚖', '🚡', '🚠', '🚟', '🚃', '🚋', '🚞', '🚝', '🚄', '🚅', '🚈', '🚂', '🚆', '🚇', '🚊', '🚉', '✈️', '🛫', '🛬', '🛩️', '💺', '🛰️', '🚀', '🛸', '🚁', '🛶', '⛵', '🚤', '🛥️', '🛳️', '⛴️', '🚢', '⚓', '⛽', '🚧', '🚦', '🚥', '🚏', '🗺️', '🗿', '🗽', '🗼', '🏰', '🏯', '🏟️', '🎡', '🎢', '🎠', '⛲', '⛱️', '🏖️', '🏝️', '🏜️', '🌋', '⛰️', '🏔️', '🗻', '🏕️', '⛺', '🏡', '🏘️', '🏚️', '🏗️', '🏭', '🏢', '🏬', '🏣', '🏤', '🏥', '🏦', '🏨', '🏪', '🏫', '🏩', '💒', '🏛️', '⛪', '🕌', '🕍', '🛕', '🕋', '⛩️', '🛤️', '🛣️', '🗾', '🎑', '🏞️', '🌅', '🌄', '🌠', '🎇', '🎆', '🌇', '🌆', '🏙️', '🌃', '🌌', '🌉', '🌁'],
  },
  {
    id: 'emotion',
    name: '情感心情',
    nameEn: 'Emotions',
    emojis: ['😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🥸', '🤩', '🥳', '😏', '😒', '😞', '😔', '😟', '😕', '🙁', '☹️', '😣', '😖', '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯', '😳', '🥵', '🥶', '😱', '😨', '😰', '😥', '😓', '🤗', '🤔', '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '🙄', '😯', '😦', '😧', '😮', '😲', '🥱', '😴', '🤤', '😪', '😵', '🤐', '🥴', '🤢', '🤮', '🤧', '😷', '🤒', '🤕', '🤑', '🤠', '😈', '👿', '👹', '👺', '🤡', '💩', '👻', '💀', '☠️', '👽', '👾', '🤖', '🎃', '😺', '😸', '😹', '😻', '😼', '😽', '🙀', '😿', '😾'],
  },
  {
    id: 'objects',
    name: '物品手势',
    nameEn: 'Objects & Gestures',
    emojis: ['👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍', '👎', '✊', '👊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️', '💅', '🤳', '🦾', '🦿', '🦵', '🦶', '👂', '🦻', '👃', '🧠', '🦷', '🦴', '👀', '👁️', '👅', '👄', '💪', '💰', '💳', '💎', '⚖️', '🔧', '🔨', '💊'],
  },
];

// 最近使用存储键
const RECENT_EMOJIS_KEY = 'mood_journal_recent_emojis';
const MAX_RECENT_EMOJIS = 16;

// 获取最近使用的 emoji
export function getRecentEmojis(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(RECENT_EMOJIS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // ignore
  }
  return [];
}

// 保存最近使用的 emoji
export function saveRecentEmoji(emoji: string): void {
  if (typeof window === 'undefined') return;
  try {
    const recent = getRecentEmojis();
    // 移除已存在的相同 emoji
    const filtered = recent.filter(e => e !== emoji);
    // 添加到开头
    const updated = [emoji, ...filtered].slice(0, MAX_RECENT_EMOJIS);
    localStorage.setItem(RECENT_EMOJIS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

interface EmojiPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  selectedEmoji?: string;
}

// 获取搜索匹配的标签（用于显示提示）
function getMatchingTags(emoji: string, query: string): string[] {
  const tags = EMOJI_TAGS[emoji] || [];
  const queryLower = query.toLowerCase().trim();
  return tags.filter(tag => matchesPinyin(tag, queryLower)).slice(0, 2);
}

export default function EmojiPicker({ isOpen, onClose, onSelect, selectedEmoji }: EmojiPickerProps) {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('recent');
  const [recentEmojis, setRecentEmojis] = useState<string[]>([]);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [showKeyboardHint, setShowKeyboardHint] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const emojiButtonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // 加载最近使用的 emoji
  useEffect(() => {
    if (isOpen) {
      setRecentEmojis(getRecentEmojis());
      setFocusedIndex(-1);
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 100);
      const timer = setTimeout(() => setShowKeyboardHint(true), 500);
      const hideTimer = setTimeout(() => setShowKeyboardHint(false), 4000);
      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, [isOpen]);

  // 搜索过滤（支持中文、拼音、英文）
  const filteredEmojis = useMemo(() => {
    if (!searchQuery.trim()) return null;
    
    const query = searchQuery.toLowerCase().trim();
    const results: string[] = [];
    
    Object.entries(EMOJI_TAGS).forEach(([emoji, tags]) => {
      if (tags.some(tag => matchesPinyin(tag, query))) {
        results.push(emoji);
      }
    });
    
    return results;
  }, [searchQuery]);

  const currentEmojis = useMemo(() => {
    if (filteredEmojis) return filteredEmojis;
    if (activeCategory === 'recent') {
      return recentEmojis.length > 0 ? recentEmojis : EMOJI_CATEGORIES[1].emojis.slice(0, 32);
    }
    const category = EMOJI_CATEGORIES.find(c => c.id === activeCategory);
    return category?.emojis || [];
  }, [filteredEmojis, activeCategory, recentEmojis]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;
    const cols = window.innerWidth < 640 ? 8 : 10;
    const total = currentEmojis.length;
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev + cols;
          return next < total ? next : prev;
        });
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => {
          const next = prev - cols;
          return next >= 0 ? next : -1;
        });
        break;
      case 'ArrowLeft':
        e.preventDefault();
        setFocusedIndex(prev => (prev > 0 ? prev - 1 : prev));
        break;
      case 'ArrowRight':
        e.preventDefault();
        setFocusedIndex(prev => (prev < total - 1 ? prev + 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < total) {
          handleSelect(currentEmojis[focusedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      case '/':
        if (document.activeElement !== searchInputRef.current) {
          e.preventDefault();
          searchInputRef.current?.focus();
        }
        break;
    }
  }, [isOpen, currentEmojis, focusedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, handleKeyDown]);

  useEffect(() => {
    if (focusedIndex >= 0 && emojiButtonRefs.current[focusedIndex]) {
      emojiButtonRefs.current[focusedIndex]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [focusedIndex]);

  const handleSelect = (emoji: string) => {
    saveRecentEmoji(emoji);
    setRecentEmojis(getRecentEmojis());
    onSelect(emoji);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      {/* Picker Panel */}
      <div className="relative z-10 w-full max-w-2xl bg-card rounded-2xl shadow-elevated border border-border overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h3 className="text-xl font-semibold">{t('emojiPicker.title')}</h3>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setFocusedIndex(-1);
              }}
              placeholder={`${t('emojiPicker.search')} (${t('emojiPicker.searchHint')})`}
              className="w-full pl-11 pr-10 py-3 rounded-xl border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center px-1.5 py-0.5 text-xs font-mono bg-muted rounded border">
              /
            </kbd>
          </div>
          {searchQuery && filteredEmojis && filteredEmojis.length > 0 && (
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="h-3 w-3 text-primary" />
              <span>{t('emojiPicker.foundResults', { count: filteredEmojis.length })}</span>
            </div>
          )}
        </div>

        {/* Category Tabs */}
        {!filteredEmojis && (
          <div className="flex gap-2 p-3 border-b border-border overflow-x-auto scrollbar-thin">
            {EMOJI_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={cn(
                  'px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all',
                  activeCategory === category.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                )}
              >
                {t(`emojiPicker.categories.${category.id}`)}
              </button>
            ))}
          </div>
        )}

        {/* Emoji Grid */}
        <div className="p-4 max-h-96 overflow-y-auto scrollbar-thin">
          {filteredEmojis && filteredEmojis.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t('emojiPicker.noResults')}</p>
              <p className="text-xs mt-1">{t('emojiPicker.tryOther')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-8 sm:grid-cols-10 gap-2">
              {currentEmojis.map((emoji, index) => (
                <button
                  key={`${emoji}-${index}`}
                  ref={el => { emojiButtonRefs.current[index] = el; }}
                  onClick={() => handleSelect(emoji)}
                  onMouseEnter={() => setFocusedIndex(index)}
                  className={cn(
                    'w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary',
                    selectedEmoji === emoji
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary ring-offset-2'
                      : focusedIndex === index
                      ? 'bg-accent ring-2 ring-primary/50'
                      : 'hover:bg-accent'
                  )}
                  title={EMOJI_TAGS[emoji]?.[0] || emoji}
                  tabIndex={-1}
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 键盘导航提示 */}
        {showKeyboardHint && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-popover border border-border rounded-lg px-3 py-2 shadow-lg animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded border">↑↓←→</kbd>
                <span>{t('emojiPicker.navigate')}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded border">Enter</kbd>
                <span>{t('emojiPicker.select')}</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-muted rounded border">ESC</kbd>
                <span>{t('emojiPicker.close')}</span>
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-border bg-secondary/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{t('emojiPicker.currentSelection')}:</span>
              {selectedEmoji ? (
                <span className="text-2xl">{selectedEmoji}</span>
              ) : (
                <span className="text-sm text-muted-foreground">{t('emojiPicker.notSelected')}</span>
              )}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>{t('emojiPicker.autoSave')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
