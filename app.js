﻿﻿﻿﻿// ===== 鎏金粒子系统（含鼠标交互） =====
(function() {
  const canvas = document.getElementById('particleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let particles = [];
  const COUNT = 60;
  let mouse = { x: -9999, y: -9999, active: false };

  function resize() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.active = true;
  });
  document.addEventListener('mouseleave', () => { mouse.active = false; mouse.x = -9999; mouse.y = -9999; });

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * canvas.width;
      this.y = Math.random() * canvas.height;
      this.size = Math.random() * 2.2 + 0.5;
      this.speedX = (Math.random() - 0.5) * 0.3;
      this.speedY = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.35 + 0.08;
      this.gold = Math.random() > 0.25;
      this.baseOpacity = this.opacity;
    }
    update() {
      if (mouse.active) {
        const dx = mouse.x - this.x;
        const dy = mouse.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 180) {
          const force = (180 - dist) / 180 * 0.015;
          this.speedX += dx * force * 0.05;
          this.speedY += dy * force * 0.05;
          this.opacity = this.baseOpacity + (1 - dist / 180) * 0.3;
        } else {
          this.opacity += (this.baseOpacity - this.opacity) * 0.05;
        }
      }
      this.speedX *= 0.98;
      this.speedY *= 0.98;
      this.x += this.speedX;
      this.y += this.speedY;
      if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fillStyle = this.gold ? `rgba(212,162,78,${this.opacity * 0.7})` : `rgba(210,120,80,${this.opacity * 0.45})`;
      ctx.fill();
    }
  }

  for (let i = 0; i < COUNT; i++) particles.push(new Particle());

  function drawConnections() {
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 100) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(212,162,78,${(1 - dist / 100) * 0.08})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
  }

  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => { p.update(); p.draw(); });
    drawConnections();
    requestAnimationFrame(animate);
  }
  animate();
})();

// ===== 导航栏滚动效果 =====
window.addEventListener('scroll', () => {
  const nav = document.getElementById('mainNav');
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 50);
});

// ===== 导航链接鼠标跟踪 =====
(function() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('mousemove', (e) => {
      const rect = link.getBoundingClientRect();
      link.style.setProperty('--nav-mouse-x', (e.clientX - rect.left) + 'px');
      link.style.setProperty('--nav-mouse-y', (e.clientY - rect.top) + 'px');
    });
  });
})();

// ===== 滚动渐显 =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add('visible'); });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ===== 滚动指示器 =====
(function() {
  const heroes = document.querySelectorAll('.page-hero, .hero');
  heroes.forEach(hero => {
    const indicator = document.createElement('div');
    indicator.className = 'scroll-indicator';
    indicator.innerHTML = '<span>SCROLL</span>';
    hero.appendChild(indicator);
  });
})();

// ===== 鼠标光晕跟随 =====
(function() {
  const glow = document.createElement('div');
  glow.className = 'cursor-glow';
  document.body.appendChild(glow);
  let gx = 0, gy = 0, tx = 0, ty = 0;
  document.addEventListener('mousemove', (e) => { tx = e.clientX; ty = e.clientY; });
  function animateGlow() {
    gx += (tx - gx) * 0.12;
    gy += (ty - gy) * 0.12;
    glow.style.transform = `translate(${gx - 160}px, ${gy - 160}px)`;
    requestAnimationFrame(animateGlow);
  }
  animateGlow();
})();

// ===== 鼠标轨迹粒子：暖金轨迹 + 珊瑚橙→淡粉扩散，缓慢淡出 =====
(function() {
  if (window.matchMedia && !window.matchMedia('(pointer: fine)').matches) return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9990;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let W, H;
  function resize() { W = canvas.width = window.innerWidth; H = canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);

  const GOLD = [212, 162, 78];   // 暖金（轨迹）
  const CORAL = [240, 112, 60];  // 珊瑚橙
  const PINK = [255, 182, 193];  // 淡粉

  const parts = [];
  const MAX = 220;
  let mx = -999, my = -999, lx = -999, ly = -999, moving = 0;

  document.addEventListener('mousemove', (e) => { mx = e.clientX; my = e.clientY; moving = 8; });

  function spawnTrail(x, y) {
    if (parts.length >= MAX) parts.shift();
    parts.push({ x, y, vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6 - 0.2,
      r: 1 + Math.random() * 1.6, life: 1, decay: 0.035 + Math.random() * 0.03, type: 'trail' });
  }
  function spawnBurst(x, y) {
    const n = 2 + (Math.random() * 2 | 0);
    for (let i = 0; i < n; i++) {
      if (parts.length >= MAX) parts.shift();
      const a = Math.random() * Math.PI * 2, sp = 0.6 + Math.random() * 1.8;
      parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 0.3,
        r: 1.6 + Math.random() * 2.4, life: 1, decay: 0.012 + Math.random() * 0.012, type: 'burst' });
    }
  }

  function lerp(a, b, t) { return a + (b - a) * t; }
  function tick() {
    ctx.clearRect(0, 0, W, H);
    if (moving > 0 && lx > -900) {
      const dx = mx - lx, dy = my - ly, dist = Math.hypot(dx, dy);
      const steps = Math.min(Math.floor(dist / 6) + 1, 6);
      for (let i = 1; i <= steps; i++) spawnTrail(lx + dx * i / steps, ly + dy * i / steps);
      if (Math.random() < 0.35) spawnBurst(mx, my);
      moving--;
    }
    lx = mx; ly = my;
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.x += p.vx; p.y += p.vy;
      p.vx *= 0.96; p.vy *= 0.96;
      p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      const t = 1 - p.life;
      let r, g, b, a;
      if (p.type === 'trail') {
        r = GOLD[0]; g = GOLD[1]; b = GOLD[2];
        a = Math.min(1, p.life * 1.6) * 0.85;
      } else {
        const k = Math.min(1, t * 1.4);
        r = lerp(CORAL[0], PINK[0], k); g = lerp(CORAL[1], PINK[1], k); b = lerp(CORAL[2], PINK[2], k);
        a = Math.pow(p.life, 1.5) * 0.9;
      }
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.type === 'burst' ? p.r * (0.6 + 0.4 * p.life) : p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r | 0},${g | 0},${b | 0},${a.toFixed(3)})`;
      ctx.fill();
    }
    requestAnimationFrame(tick);
  }
  tick();
})();

// ===== 卡片 3D 倾斜 =====
(function() {
  const cards = document.querySelectorAll('.glass-card, .timeline-card, .counter-card, .figure-card, .map-item, .pattern-card, .palette-card, .application-card, .equipment-card, .compare-side, .heritage-card, .stat-card, .feature-card');
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = (y - centerY) / centerY * -3;
      const rotateY = (x - centerX) / centerX * 3;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
      const glowX = (x / rect.width * 100).toFixed(1);
      const glowY = (y / rect.height * 100).toFixed(1);
      card.style.setProperty('--mouse-x', glowX + '%');
      card.style.setProperty('--mouse-y', glowY + '%');
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
      card.style.removeProperty('--mouse-x');
      card.style.removeProperty('--mouse-y');
    });
  });
})();

// ===== Hero 视差 =====
(function() {
  const heroes = document.querySelectorAll('.page-hero-content, .hero-content');
  if (!heroes.length) return;
  document.addEventListener('mousemove', (e) => {
    const mx = (e.clientX / window.innerWidth - 0.5) * 2;
    const my = (e.clientY / window.innerHeight - 0.5) * 2;
    heroes.forEach(hero => {
      const rect = hero.closest('.page-hero, .hero')?.getBoundingClientRect();
      if (!rect || rect.bottom < 0 || rect.top > window.innerHeight) return;
      hero.style.transform = `translate(${mx * 12}px, ${my * 8}px)`;
    });
  });
})();

// ===== 区块标题文字微光 =====
(function() {
  const titles = document.querySelectorAll('.section-title');
  titles.forEach(title => {
    title.addEventListener('mousemove', (e) => {
      const rect = title.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width * 200 - 50).toFixed(1);
      title.style.backgroundPosition = x + '% center';
    });
    title.addEventListener('mouseleave', () => {
      title.style.backgroundPosition = 'center';
    });
  });
})();

// ===== 滚动渐显（交错动画） =====
const staggerObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter(e => e.isIntersecting);
  visible.forEach((entry, i) => {
    setTimeout(() => { entry.target.classList.add('visible'); }, i * 80);
    staggerObserver.unobserve(entry.target);
  });
}, { threshold: 0.08 });
document.querySelectorAll('.reveal-stagger').forEach(el => staggerObserver.observe(el));

// ===== 数字滚动 =====
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const target = parseInt(el.dataset.target);
      const duration = 2000;
      const start = performance.now();
      function update(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(target * eased);
        if (progress < 1) requestAnimationFrame(update);
      }
      requestAnimationFrame(update);
      counterObserver.unobserve(el);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('.stat-number').forEach(el => counterObserver.observe(el));

// ===== 鼠标粒子跟随 =====
(function() {
  const trailCanvas = document.createElement('canvas');
  trailCanvas.id = 'trailCanvas';
  trailCanvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:9998;';
  document.body.appendChild(trailCanvas);
  const tCtx = trailCanvas.getContext('2d');
  let trailParticles = [];
  let trailMouse = { x: -9999, y: -9999 };
  let lastTrailMouse = { x: -9999, y: -9999 };

  function resizeTrail() { trailCanvas.width = window.innerWidth; trailCanvas.height = window.innerHeight; }
  resizeTrail();
  window.addEventListener('resize', resizeTrail);

  document.addEventListener('mousemove', (e) => {
    trailMouse.x = e.clientX;
    trailMouse.y = e.clientY;
    const dx = trailMouse.x - lastTrailMouse.x;
    const dy = trailMouse.y - lastTrailMouse.y;
    const speed = Math.sqrt(dx * dx + dy * dy);
    const count = Math.min(Math.floor(speed / 4) + 1, 5);
    for (let i = 0; i < count; i++) {
      const angle = Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.2;
      const vel = Math.random() * 1.5 + 0.3;
      const isGold = Math.random() > 0.35;
      trailParticles.push({
        x: trailMouse.x + (Math.random() - 0.5) * 6,
        y: trailMouse.y + (Math.random() - 0.5) * 6,
        size: Math.random() * 2.8 + 0.8,
        speedX: Math.cos(angle) * vel * (Math.random() * 0.5 + 0.5),
        speedY: Math.sin(angle) * vel * (Math.random() * 0.5 + 0.5) - Math.random() * 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        life: 1,
        decay: Math.random() * 0.015 + 0.012,
        color: isGold ? [212, 162, 78] : [210, 120, 80]
      });
    }
    lastTrailMouse.x = trailMouse.x;
    lastTrailMouse.y = trailMouse.y;
  });

  document.addEventListener('mouseleave', () => {
    trailMouse.x = -9999;
    trailMouse.y = -9999;
  });

  function animateTrail() {
    tCtx.clearRect(0, 0, trailCanvas.width, trailCanvas.height);
    for (let i = trailParticles.length - 1; i >= 0; i--) {
      const p = trailParticles[i];
      p.life -= p.decay;
      if (p.life <= 0) { trailParticles.splice(i, 1); continue; }
      p.x += p.speedX;
      p.y += p.speedY;
      p.speedX *= 0.97;
      p.speedY *= 0.97;
      p.speedY += 0.01;
      p.size *= 0.995;
      const alpha = p.opacity * p.life;
      tCtx.beginPath();
      tCtx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      tCtx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha})`;
      tCtx.fill();
      tCtx.beginPath();
      tCtx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
      tCtx.fillStyle = `rgba(${p.color[0]},${p.color[1]},${p.color[2]},${alpha * 0.15})`;
      tCtx.fill();
    }
    if (trailParticles.length > 300) trailParticles.splice(0, trailParticles.length - 300);
    requestAnimationFrame(animateTrail);
  }
  animateTrail();
})();

// ===== 点击涟漪效果 =====
(function() {
  document.addEventListener('click', (e) => {
    const ripple = document.createElement('div');
    ripple.style.cssText = `
      position:fixed;left:${e.clientX}px;top:${e.clientY}px;
      width:0;height:0;border-radius:50%;pointer-events:none;z-index:9999;
      border:2px solid rgba(212,162,78,0.2);
      transform:translate(-50%,-50%);
      transition:all 0.6s ease-out;
    `;
    document.body.appendChild(ripple);
    requestAnimationFrame(() => {
      ripple.style.width = '80px';
      ripple.style.height = '80px';
      ripple.style.opacity = '0';
      ripple.style.borderWidth = '1px';
    });
    setTimeout(() => ripple.remove(), 650);

    const ripple2 = document.createElement('div');
    ripple2.style.cssText = `
      position:fixed;left:${e.clientX}px;top:${e.clientY}px;
      width:0;height:0;border-radius:50%;pointer-events:none;z-index:9999;
      border:1px solid rgba(212,162,78,0.25);
      transform:translate(-50%,-50%);
      transition:all 0.8s ease-out;
    `;
    document.body.appendChild(ripple2);
    requestAnimationFrame(() => {
      ripple2.style.width = '120px';
      ripple2.style.height = '120px';
      ripple2.style.opacity = '0';
    });
    setTimeout(() => ripple2.remove(), 850);
  });
})();

// ===== 数字人 =====
function toggleDH() {
  document.getElementById('dhPanel').classList.toggle('open');
}

const identityData = {
  youth: {
    name: '青年体验官',
    greeting: '你好！我是雄安数字体验官，可以为你介绍项目概况、网站功能和雄安文化。有什么想了解的？',
    answers: {
      '项目': '本项目以 AIGC 技术为核心，对雄安新区六大非物质文化遗产进行数字化保护与创新展示，包含非遗博览、数字孪生、纹样重构等六大板块。',
      '功能': '本站包含首页、时光回溯、非遗博览（6个独立专题页）、数字孪生大屏、AIGC创作工坊、AI纹样重构实验室共12个页面。',
      '雄安': '雄安新区于2017年4月1日设立，是继深圳经济特区和上海浦东新区之后又一具有全国意义的新区，承载着千年大计、国家大事的使命。'
    }
  },
  scholar: {
    name: '历史研学学者',
    greeting: '欢迎来到雄安历史长廊。我专注于宋辽边关至现代新城的千年变迁，有任何历史问题都可以问我。',
    answers: {
      '历史': '雄安历史可追溯至宋辽时期，作为边关重镇，历经明清民俗积淀、近代水乡岁月，至2017年新区诞生，见证千年沧桑巨变。',
      '变迁': '从宋辽边关的军事重镇，到明清时期的民俗繁荣，再到白洋淀水乡的独特生态，最终蜕变为现代化智慧城市，雄安的变迁是一部浓缩的中国北方发展史。'
    }
  },
  artisan: {
    name: '非遗匠人',
    greeting: '我是非遗匠人，深耕白洋淀芦苇画、雄州黑陶等六大非遗项目。想了解哪项非遗技艺？',
    answers: {
      '非遗': '雄安拥有国家级非遗2项（鹰爪翻子拳、西河大鼓）、省级非遗4项（白洋淀芦苇画、雄州黑陶、双堂盒子灯、圈头村古乐），每一项都承载着深厚的文化底蕴。',
      '芦苇画': '白洋淀芦苇画以芦苇为原料，经剪、割、刨、漂、压、烙、绘七道工序，将普通芦苇化为精美艺术品，是白洋淀水乡文化的杰出代表。',
      '黑陶': '雄州黑陶传承千年，以"黑如漆、亮如镜、薄如纸、硬如瓷"著称，其纹样蕴含丰富的民俗寓意，是北方陶艺的瑰宝。'
    }
  },
  planner: {
    name: '城市规划师',
    greeting: '你好！我是雄安城市规划师，专注于数字孪生城市、智慧城市建设与新区发展规划。',
    answers: {
      '规划': '雄安新区规划构建"一主、五辅、多节点"空间布局，重点发展启动区、商务区、生态区和科创区，打造绿色、智能、创新的未来之城。',
      '数字孪生': '数字孪生大屏实时展示千年秀林绿化增长、白洋淀生态水质修复、新区产业人才建设等核心数据，是智慧城市管理的数字大脑。'
    }
  },
  reporter: {
    name: '雄安新闻发言人',
    greeting: '你好！我是雄安非遗新闻发言人，随时为你播报非遗展览、活动、赛事、文化交流等最新动态。想了解哪方面的新闻？',
    answers: {
      '展览': '2024年12月，雄安非遗数字创新展在中国国家博物馆开幕，集中展示AIGC纹样重构、三维数字孪生、交互式非遗体验等数字化成果，展览持续至2025年2月，预计接待观众超20万人次。',
      '活动': '2024年11月，六大非遗传承人齐聚雄县同台献艺，现场设有芦苇剪贴、陶器拉坯等体验区，为公众带来沉浸式非遗文化盛宴。此外，非遗进校园活动已在雄县20所中小学开展。',
      '赛事': '2024年8月，首届"AIGC+非遗"数字创作大赛启动报名，面向全国高校和创作者征集以雄安非遗为灵感的AIGC数字作品，总奖金池30万元，优秀作品将入选雄安非遗数字资源库。',
      '交流': '2024年7月，雄安六大非遗项目及数字化创新成果在第五届国际文化遗产博览会上展出，接待了来自20余个国家的参展嘉宾，向世界展示中国传统文化的数字新生。',
      '文创': '2024年3月，融合芦苇画纹样、黑陶质感、盒子灯造型等非遗元素的30余款文创产品正式发布，涵盖文具、家居、服饰等品类，让非遗走进日常生活。',
      '纪录片': '大型非遗纪录片《雄安匠心》已于2024年4月开机拍摄，以六大传承人的技艺与人生为主线，用4K超高清影像记录非遗技艺细节，预计2025年初在央视播出，共6集。',
      '志愿者': '2024年2月，雄安非遗保护志愿者计划启动招募，面向社会公开招募200名志愿者，参与非遗普查、数字化记录、展览讲解等工作，志愿者将接受专业培训并获颁证书。',
      '资源库': '2024年6月，雄安非遗数字资源库正式上线，已收录六大非遗项目的3000余件纹样、影像、音频数据，面向高校和科研机构开放访问，支持AI纹样检索与智能匹配。'
    }
  },
  policyExpert: {
    name: '政策法规专家',
    greeting: '你好！我是非遗政策法规专家，专注于非遗保护法律法规、数字化保护政策及传承人扶持制度的解读。有什么政策问题想咨询？',
    answers: {
      '非遗法': '《中华人民共和国非物质文化遗产法》于2011年2月25日颁布，是我国非遗保护领域的核心法律，确立了非遗保护、保存、传承与传播的法律框架，明确了非遗定义、保护原则及各级政府与传承人的权利义务。',
      '河北': '《河北省非物质文化遗产条例》于2014年9月26日颁布，结合本省实际细化了非遗保护、传承、利用的具体措施，规范了非遗项目名录建设、传承人认定及经费保障机制。',
      '雄安管理办法': '《雄安新区非物质文化遗产保护管理办法》于2020年颁布，针对雄安新区非遗保护实际制定，建立了新区非遗项目名录与传承人管理体系，协调新区建设中非遗保护与城市发展的关系。',
      '数字化': '《关于推进非物质文化遗产数字化保护的指导意见》于2022年由文化和旅游部发布，鼓励运用数字技术对非遗项目进行采集、存储、记录与展示，支持建设非遗数字资源库与线上展示平台。',
      '传承人补贴': '《雄安新区非遗传承人补贴与扶持办法》于2023年颁布，明确传承人补贴标准与扶持方式，包括年度生活补贴、传习活动经费、收徒培养奖励等，为传承人开展传承活动提供资金保障。',
      'AIGC管理': '《AIGC技术赋能非遗创新应用管理规范》于2024年颁布，规范AIGC技术在非遗纹样重构、三维重建等场景中的应用标准，明确数字成果的知识产权归属与使用边界，保障非遗数字化创新的规范发展。',
      '政策': '雄安非遗保护政策体系包含六个层次：国家非遗法（2011）、河北省条例（2014）、雄安管理办法（2020）、数字化指导意见（2022）、传承人补贴办法（2023）、AIGC管理规范（2024），从保护到创新形成完整政策链条。'
    }
  },
  oralHistory: {
    name: '传承人·刘永利',
    greeting: '你好！我是白洋淀芦苇画省级非遗代表性传承人刘永利的数字分身，可以为你讲述我的从艺经历、芦苇画技艺与代表作品。',
    answers: {
      '生平': '我出生在白洋淀边的安新县，从小跟着父辈在淀里割芦苇、编苇席。年轻时拜入芦苇画老艺人门下学艺，从艺四十余年，见证了芦苇画从农家手艺变成省级非遗的全过程。',
      '学艺': '学艺先学选苇——要挑白洋淀当年生的直立芦苇，去皮、晾晒、分类。光是剪苇片就练了整整两年，师父说"手上没准头，画就没有魂"。',
      '技艺': '芦苇画要经选材、剪贴、烙制定型三大工序：用烙铁在苇片上烙出深浅层次，再一层层拼贴成画。一幅大画往往要贴上千片苇绒，急不得。',
      '作品': '我的代表作有《白洋淀秋韵》《荷塘清趣》《千里堤防图》等，其中《白洋淀秋韵》用三千余片苇绒表现淀上芦花盛开，获省级工艺美术金奖。',
      '荣誉': '我先后获评省级非物质文化遗产代表性传承人、河北省工艺美术大师，作品多次在国家级展览中获奖，还带着芦苇画走出国门参加国际文化交流。',
      '收徒': '这些年前前后后收了三十多个徒弟，不少年轻人学成后回到淀边开店创业。非遗要活下去，就得让年轻人靠这门手艺过上好日子。',
      '芦苇画': '芦苇画以白洋淀芦苇为原料，经剪、割、刨、漂、压、烙、绘多道工序制成，画面本色天然、古朴典雅，被誉为"绿色艺术"，是白洋淀水乡文化的活化石。',
      '数字化': '这两年我和数字平台合作，把芦苇画纹样做了高精度扫描和AI重构，年轻人扫一扫就能看到每幅画的制作过程。老手艺配上新技术，传承的路子更宽了。'
    }
  }
};

let currentIdentity = (() => {
  const activeTab = document.querySelector('.dh-identity-tab.active');
  return activeTab ? activeTab.dataset.identity : 'youth';
})();

document.querySelectorAll('.dh-identity-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.dh-identity-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentIdentity = tab.dataset.identity;
    const data = identityData[currentIdentity];
    document.getElementById('dhChatArea').innerHTML = `<div class="dh-chat-msg"><span class="role">${data.name}：</span>${data.greeting}</div>`;
  });
});

function sendDH() {
  const input = document.getElementById('dhInput');
  const msg = input.value.trim();
  if (!msg) return;
  const chatArea = document.getElementById('dhChatArea');
  chatArea.innerHTML += `<div class="dh-chat-msg"><span class="role">你：</span>${msg}</div>`;
  input.value = '';

  const data = identityData[currentIdentity];
  let reply = '感谢你的问题！作为' + data.name + '，我会持续学习雄安文化知识，为你提供更好的解答。';
  for (const [key, val] of Object.entries(data.answers)) {
    if (msg.includes(key)) { reply = val; break; }
  }
  setTimeout(() => {
    chatArea.innerHTML += `<div class="dh-chat-msg"><span class="role">${data.name}：</span>${reply}</div>`;
    chatArea.scrollTop = chatArea.scrollHeight;
  }, 600);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ===== 移动端汉堡菜单 =====
document.getElementById('navToggle')?.addEventListener('click', function() {
  this.classList.toggle('active');
  document.querySelector('.nav-menu')?.classList.toggle('open');
});
// 点击菜单项后自动关闭
document.querySelectorAll('.nav-menu a').forEach(link => {
  link.addEventListener('click', () => {
    document.getElementById('navToggle')?.classList.remove('active');
    document.querySelector('.nav-menu')?.classList.remove('open');
  });
});

// ===== 触摸设备下拉菜单支持 =====
document.querySelectorAll('.nav-item').forEach(item => {
  const dropdown = item.querySelector('.dropdown');
  if (dropdown) {
    item.addEventListener('click', function(e) {
      // 仅在触摸设备或窄屏时拦截
      if (window.innerWidth <= 1024 || 'ontouchstart' in window) {
        if (e.target === this || e.target.classList.contains('nav-link')) {
          e.preventDefault();
          // 关闭其他下拉
          document.querySelectorAll('.nav-item.dropdown-open').forEach(other => {
            if (other !== this) other.classList.remove('dropdown-open');
          });
          this.classList.toggle('dropdown-open');
        }
      }
    });
  }
});
// 点击页面其他地方关闭下拉
document.addEventListener('click', function(e) {
  if (!e.target.closest('.nav-item')) {
    document.querySelectorAll('.nav-item.dropdown-open').forEach(item => {
      item.classList.remove('dropdown-open');
    });
  }
});

// ===== 返回顶部按钮 =====
window.addEventListener('scroll', () => {
  const btn = document.getElementById('backToTop');
  if (btn) btn.classList.toggle('show', window.scrollY > 600);
});

// ===== 滚动进度条 =====
window.addEventListener('scroll', () => {
  const bar = document.getElementById('scrollProgress');
  if (!bar) return;
  const h = document.documentElement;
  const total = h.scrollHeight - h.clientHeight;
  bar.style.width = (total > 0 ? (h.scrollTop / total * 100) : 0) + '%';
});

// ===== 数字人升级：多关键词匹配 + 打字指示器 =====
if (typeof identityData !== 'undefined') {
  function smartMatch(msg, answers) {
    // 收集所有匹配的 key 的答案
    const hits = [];
    for (const [key, val] of Object.entries(answers)) {
      if (key.split(/[，,、\s]/).some(k => k && msg.includes(k))) {
        if (!hits.includes(val)) hits.push(val);
      }
    }
    return hits;
  }
  const _origSendDH = typeof sendDH;
  // 覆写 sendDH 函数
  window.sendDH = function() {
    const input = document.getElementById('dhInput');
    const msg = input.value.trim();
    if (!msg) return;
    const chatArea = document.getElementById('dhChatArea');
    chatArea.innerHTML += `<div class="dh-chat-msg"><span class="role">你：</span>${msg}</div>`;
    input.value = '';
    const data = identityData[currentIdentity];

    // 多关键词匹配
    const hits = smartMatch(msg, data.answers);
    let reply;
    if (hits.length === 0) {
      reply = '感谢你的问题！作为' + data.name + '，我正在持续学习雄安文化知识，建议你问我：项目、功能、雄安、非遗、芦苇画、黑陶、历史、规划、数字孪生 等关键词。';
    } else if (hits.length === 1) {
      reply = hits[0];
    } else {
      reply = hits.map((h, i) => (i + 1) + '. ' + h).join('<br><br>');
    }

    // 打字指示器
    const typing = document.createElement('div');
    typing.className = 'dh-chat-msg dh-typing';
    typing.innerHTML = `<span class="role">${data.name}：</span><span class="dots"><i></i><i></i><i></i></span>`;
    chatArea.appendChild(typing);
    chatArea.scrollTop = chatArea.scrollHeight;

    setTimeout(() => {
      typing.remove();
      chatArea.innerHTML += `<div class="dh-chat-msg"><span class="role">${data.name}：</span>${reply}</div>`;
      chatArea.scrollTop = chatArea.scrollHeight;
    }, 800);
    chatArea.scrollTop = chatArea.scrollHeight;
  };
}

// ===== 全站搜索 =====
(function() {
  const searchBtn = document.getElementById('searchBtn');
  const overlay = document.getElementById('searchOverlay');
  const input = document.getElementById('searchInput');
  const closeBtn = document.getElementById('searchClose');
  const resultsEl = document.getElementById('searchResults');
  if (!searchBtn || !overlay) return;

  const searchData = [
    { title: '白洋淀芦苇画', desc: '省级非遗，以芦苇为原料，经剪、贴、烙等工艺制作', tag: '非遗项目', icon: '', url: 'heritage-reed.html' },
    { title: '雄州黑陶', desc: '省级非遗，传承千年窑火，拉坯刻纹工艺精湛', tag: '非遗项目', icon: '🏺', url: 'heritage-pottery.html' },
    { title: '双堂盒子灯', desc: '省级非遗，传统民俗灯彩，庙会文化代表', tag: '非遗项目', icon: '🏮', url: 'heritage-lantern.html' },
    { title: '圈头村古乐', desc: '省级非遗，千年雅乐，工尺谱口传心授', tag: '非遗项目', icon: '🎵', url: 'heritage-music.html' },
    { title: '鹰爪翻子拳', desc: '国家级非遗，刚劲有力的传统武术', tag: '非遗项目', icon: '', url: 'heritage-martial.html' },
    { title: '西河大鼓', desc: '国家级非遗，传统曲艺，书声琅琅', tag: '非遗项目', icon: '🥁', url: 'heritage-drum.html' },
    { title: '非遗博览', desc: '六大非遗项目深度展示，独立专题页面', tag: '页面', icon: '📖', url: 'heritage.html' },
    { title: '时光回溯', desc: '古今双屏对比，雄安历史变迁', tag: '页面', icon: '⏳', url: 'timeline.html' },
    { title: '数字孪生大屏', desc: '雄安新区数字孪生可视化，实时数据展示', tag: '页面', icon: '🌐', url: 'digital-twin.html' },
    { title: 'AIGC 创作工坊', desc: 'AI 生成非遗纹样，创作流程展示', tag: '页面', icon: '🤖', url: 'aigc.html' },
    { title: 'AI 纹样重构实验室', desc: '计算机视觉纹样识别与 AI 重构', tag: '页面', icon: '🔬', url: 'pattern-lab.html' },
    { title: '数字生', desc: '实体城市与数字城市同步规划，全球领先智慧城市', tag: '技术', icon: '🏙️', url: 'digital-twin.html' },
    { title: 'AI 非遗保护', desc: 'AIGC 技术赋能纹样重构、三维重建', tag: '技术', icon: '🧠', url: 'aigc.html' },
    { title: '计算机视觉', desc: '深度学习与图像处理，非遗纹样自动识别与特征提取', tag: '技术', icon: '👁️', url: 'pattern-lab.html' },
    { title: 'Stable Diffusion', desc: '扩散模型对传统纹样进行风格迁移与创新生成', tag: '技术', icon: '🎨', url: 'aigc.html' },
    { title: 'WebGL', desc: '三维数字孪生模型，城市数据实时可视化', tag: '技术', icon: '🌐', url: 'digital-twin.html' },
    { title: '传承人', desc: '非遗技艺代代相传，匠人精神', tag: '人物', icon: '👤', url: 'heritage.html' },
    { title: '芦苇画传承人', desc: '白洋淀芦苇画技艺传承人，手工剪贴烙制', tag: '人物', icon: '👤', url: 'heritage-reed.html' },
    { title: '黑陶艺人', desc: '雄州黑陶拉坯刻纹，世代相传', tag: '人物', icon: '👤', url: 'heritage-pottery.html' },
    { title: '古乐社', desc: '圈头村古乐社，工尺谱记录千年雅乐', tag: '人物', icon: '👥', url: 'heritage-music.html' },
    { title: '纹样', desc: '传统非遗纹样数字化采集、AI 重构', tag: '纹样', icon: '', url: 'pattern-lab.html' },
    { title: '白洋淀', desc: '华北之肾，生态治理，水质从劣Ⅴ类提升至Ⅲ类', tag: '地理', icon: '🌊', url: 'timeline.html' },
    { title: '雄安规划', desc: '千年大计，国家大事，智慧城市与非遗保护并重', tag: '规划', icon: '📐', url: 'timeline.html' },
    { title: '庙会民俗', desc: '雄州古城庙会，盒子灯展演，民间艺术百花齐放', tag: '民俗', icon: '🎪', url: 'heritage-lantern.html' },
    { title: '水乡生计', desc: '白洋淀渔民以芦苇为生，捕鱼采莲，千年水乡生活', tag: '民俗', icon: '🚣', url: 'heritage-reed.html' },
  ];

  function openSearch() {
    overlay.classList.add('show');
    setTimeout(() => input.focus(), 350);
  }
  function closeSearch() {
    overlay.classList.remove('show');
    input.value = '';
    resultsEl.innerHTML = '<div class="search-hint">输入关键词搜索非遗内容</div>';
  }

  searchBtn.addEventListener('click', openSearch);
  closeBtn.addEventListener('click', closeSearch);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) closeSearch(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeSearch();
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearch(); }
  });

  input.addEventListener('input', () => {
    const q = input.value.trim().toLowerCase();
    if (!q) { resultsEl.innerHTML = '<div class="search-hint">输入关键词搜索非遗内容</div>'; return; }
    const keywords = q.split(/\s+/);
    const matched = searchData.filter(item =>
      keywords.every(kw =>
        item.title.toLowerCase().includes(kw) ||
        item.desc.toLowerCase().includes(kw) ||
        item.tag.toLowerCase().includes(kw)
      )
    );
    if (matched.length === 0) {
      resultsEl.innerHTML = '<div class="search-no-result">未找到相关内容，试试其他关键词</div>';
      return;
    }
    resultsEl.innerHTML = matched.map(item =>
      `<a href="${item.url}" class="search-result-item">
        <span class="search-result-icon">${item.icon}</span>
        <div class="search-result-info"><h5>${item.title}</h5><p>${item.desc}</p></div>
        <span class="search-result-tag">${item.tag}</span>
      </a>`
    ).join('');
  });
})();

// ===== 背景音乐：雅乐·茶语（古琴/箫/风铃，全站统一，记忆状态） =====
(function() {
  const audio = new Audio('music/guqin-tea.mp3');
  audio.loop = true;
  audio.volume = 0.3;
  audio.preload = 'auto';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'bgm-btn';
  btn.setAttribute('aria-label', '背景音乐开关');
  btn.innerHTML =
    '<span class="bgm-disc"><span class="bgm-note">♪</span></span>' +
    '<span class="bgm-bars"><i></i><i></i><i></i></span>' +
    '<span class="bgm-tip">雅乐 · 茶语</span>';
  document.body.appendChild(btn);

  const KEY = 'xiongan_bgm_on';
  function isOn() { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } }
  function setOn(v) { try { localStorage.setItem(KEY, v ? '1' : '0'); } catch (e) {} }

  function play() {
    audio.play().then(() => {
      btn.classList.add('playing');
      setOn(true);
    }).catch(() => {});
  }
  function pause() {
    audio.pause();
    btn.classList.remove('playing');
    setOn(false);
  }

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!audio.paused) pause(); else play();
  });

  // 记住的开启状态：浏览器允许则直接续播；否则在用户首次点击页面后续播
  if (isOn()) {
    const g = () => play();
    document.addEventListener('pointerdown', g, { once: true });
    play();
  }
})();

// ===== 图片放大 Lightbox =====
(function(){
  var overlay = document.createElement('div');
  overlay.className = 'lightbox-overlay';
  overlay.innerHTML = '<button class="lightbox-close">&times;</button>'
    +'<span class="lightbox-hint">点击图片关闭</span>'
    +'<img src="" alt="">'
    +'<div class="lightbox-caption"></div>';
  document.body.appendChild(overlay);

  var img = overlay.querySelector('img');
  var caption = overlay.querySelector('.lightbox-caption');
  var closeBtn = overlay.querySelector('.lightbox-close');

  function openLightbox(src, alt) {
    img.src = src;
    img.alt = alt || '';
    caption.textContent = alt || '';
    caption.style.display = alt ? 'block' : 'none';
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeLightbox() {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
    setTimeout(function(){ img.src = ''; }, 350);
  }

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay || e.target === closeBtn || e.target === img) {
      closeLightbox();
    }
  });
  closeBtn.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('show')) closeLightbox();
  });

  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-lightbox]');
    if (el) {
      e.preventDefault();
      e.stopPropagation();
      var src = el.getAttribute('data-lightbox') || el.src;
      var alt = el.getAttribute('data-lightbox-alt') || el.alt || '';
      openLightbox(src, alt);
    }
  });

  window.openLightbox = openLightbox;
  window.closeLightbox = closeLightbox;
})();

// ===== 自动给所有图片加 lightbox =====
(function(){
  function addAutoLightbox() {
    document.querySelectorAll('img').forEach(function(img) {
      if (img.hasAttribute('data-lightbox')) return;
      if (!img.src || img.src.indexOf('data:') === 0) return;
      if (img.closest('.lightbox-overlay')) return;
      img.setAttribute('data-lightbox', img.src);
      img.setAttribute('data-lightbox-alt', img.alt || '');
      img.style.cursor = 'zoom-in';
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addAutoLightbox);
  } else {
    addAutoLightbox();
  }
  // 动态内容加载后也执行
  var origObserver = window.MutationObserver;
  if (origObserver) {
    var observer = new origObserver(function(mutations) {
      mutations.forEach(function(m) {
        m.addedNodes.forEach(function(node) {
          if (node.nodeType === 1) {
            if (node.tagName === 'IMG' && !node.hasAttribute('data-lightbox') && node.src && node.src.indexOf('data:') !== 0) {
              node.setAttribute('data-lightbox', node.src);
              node.setAttribute('data-lightbox-alt', node.alt || '');
              node.style.cursor = 'zoom-in';
            }
            node.querySelectorAll && node.querySelectorAll('img').forEach(function(img) {
              if (!img.hasAttribute('data-lightbox') && img.src && img.src.indexOf('data:') !== 0) {
                img.setAttribute('data-lightbox', img.src);
                img.setAttribute('data-lightbox-alt', img.alt || '');
                img.style.cursor = 'zoom-in';
              }
            });
          }
        });
      });
    });
    observer.observe(document.body, { childList: true, subtree: true });
  }
})();

// ===== 详情弹窗 Detail Modal =====
(function(){
  var overlay = document.createElement('div');
  overlay.className = 'detail-modal-overlay';
  overlay.innerHTML = '<div class="detail-modal-box" style="position:relative;">'
    +'<button class="detail-modal-close">&times;</button>'
    +'<img class="detail-modal-img" src="" alt="">'
    +'<div class="detail-modal-content">'
    +'<div class="dm-tag"></div>'
    +'<h3></h3>'
    +'<p></p>'
    +'</div>'
    +'<div class="detail-modal-footer"></div>'
    +'</div>';
  document.body.appendChild(overlay);

  var box = overlay.querySelector('.detail-modal-box');
  var mImg = overlay.querySelector('.detail-modal-img');
  var mTag = overlay.querySelector('.dm-tag');
  var mTitle = overlay.querySelector('h3');
  var mDesc = overlay.querySelector('p');
  var mFooter = overlay.querySelector('.detail-modal-footer');
  var mClose = overlay.querySelector('.detail-modal-close');

  function openDetail(data) {
    mImg.src = data.image || '';
    mImg.style.display = data.image ? 'block' : 'none';
    mTag.textContent = data.tag || '';
    mTag.style.display = data.tag ? 'inline-block' : 'none';
    mTitle.textContent = data.title || '';
    mDesc.innerHTML = data.description || '';
    if (data.link) {
      mFooter.innerHTML = '<a href="'+data.link+'">查看详情 →</a>';
      mFooter.style.display = 'flex';
    } else {
      mFooter.innerHTML = '';
      mFooter.style.display = 'none';
    }
    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';
  }
  function closeDetail() {
    overlay.classList.remove('show');
    document.body.style.overflow = '';
  }

  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) closeDetail();
  });
  mClose.addEventListener('click', closeDetail);
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && overlay.classList.contains('show')) closeDetail();
  });

  document.addEventListener('click', function(e) {
    var el = e.target.closest('[data-modal]');
    if (el) {
      e.preventDefault();
      var raw = el.getAttribute('data-modal');
      if (raw && raw !== 'true') {
        try {
          var data = JSON.parse(raw);
          openDetail(data);
          return;
        } catch(ex) {}
      }
    }
  });

  window.openDetail = openDetail;
  window.closeDetail = closeDetail;
})();
