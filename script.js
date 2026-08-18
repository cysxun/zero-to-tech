//图片列表，后续可以替换为本地 ./images/xxx.jpg
const photoData = [
    {
        url: "./images/small.jpg",
        title: "帝皇侠",
        info: "帝皇侠"
    },
    {
        url: "https://picsum.photos/id/1015/800/550",
        title: "山间湖景",
        info: "自然风光"
    },
    {
        url: "https://picsum.photos/id/1018/800/550",
        title: "高山原野",
        info: "户外风景"
    },
    {
        url: "https://picsum.photos/id/1035/800/550",
        title: "林间小路",
        info: "森林景色"
    },
    {
        url: "https://picsum.photos/id/1039/800/550",
        title: "海边黄昏",
        info: "日落海景"
    },
    {
        url: "https://picsum.photos/id/1043/800/550",
        title: "山野远景",
        info: "群山风光"
    },
    {
        url: "https://picsum.photos/id/1067/800/550",
        title: "城市暮色",
        info: "城市夜景"
    },
    {
        url: "https://picsum.photos/id/1027/800/550",
        title: "静谧雪地",
        info: "冬日风景"
    },
    {
        url: "https://picsum.photos/id/1060/800/550",
        title: "海岸礁石",
        info: "大海海岸"
    }

];

const galleryWrap = document.getElementById('galleryWrap');
const overlay = document.getElementById('overlay');
const previewImg = document.getElementById('previewImg');
const closeBtn = document.getElementById('closeBtn');
const themeBtn = document.getElementById('themeBtn');

//渲染相册卡片
photoData.forEach(item => {
    const card = document.createElement('div');
    card.className = 'photo-card';
    card.innerHTML = `
        <div class="img-wrap">
            <img src="${item.url}" alt="${item.title}">
        </div>
        <div class="card-desc">
            <h3>${item.title}</h3>
            <span>${item.info}</span>
        </div>
    `;
    //点击打开大图
    card.addEventListener('click', () => {
        previewImg.src = item.url;
        overlay.style.display = 'flex';
    });
    galleryWrap.appendChild(card);
});

//关闭预览
closeBtn.addEventListener('click', () => {
    overlay.style.display = 'none';
});
overlay.addEventListener('click', (e) => {
    if(e.target === overlay) overlay.style.display = 'none';
});

//深色浅色切换
themeBtn.addEventListener('click', () => {
    document.body.classList.toggle('dark-mode');
});