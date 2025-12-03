// 系所資料
const departments = [
    { code: "N701", name: "半導體系統工程學研究所", accepted: 20, waitlist: 52 },
    { code: "N702", name: "高頻脈衝學研究所", accepted: 12, waitlist: 31 },
    { code: "N703", name: "自旋電子學研究所", accepted: 6, waitlist: 13 },
    { code: "N704", name: "羅馬拼音碩士學位學程", accepted: 5, waitlist: 16 }
];

// --- 擴充後的姓氏庫 (約80個) ---
const lastNames = [
    '陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊',
    '許', '鄭', '謝', '郭', '洪', '曾', '邱', '廖', '賴', '徐',
    '周', '葉', '蘇', '莊', '呂', '江', '何', '蕭', '羅', '高',
    '潘', '簡', '朱', '鍾', '彭', '游', '詹', '胡', '施', '沈',
    '余', '盧', '梁', '趙', '顏', '柯', '翁', '魏', '孫', '戴',
    '范', '方', '宋', '鄧', '杜', '傅', '侯', '曹', '溫', '薛',
    '丁', '馬', '蔣', '唐', '卓', '藍', '馮', '姚', '石', '董',
    '紀', '歐', '程', '連', '古', '汪', '湯', '姜', '田', '康'
];

// --- 擴充後的名字庫 (超過100個常見用字) ---
const firstNames = [
    // 較中性或男性常見
    '家', '豪', '志', '明', '俊', '傑', '建', '宏', '良', '偉',
    '凱', '文', '強', '銘', '憲', '達', '耀', '興', '華', '國',
    '平', '安', '保', '成', '康', '榮', '信', '昌', '盛', '旺',
    '宇', '軒', '辰', '逸', '宥', '睿', '碩', '鈞', '奇', '廷',
    '柏', '翰', '霖', '澤', '楷', '恩', '熙', '瑋', '倫', '澔',
    '博', '揚', '承', '哲', '智', '勇', '仁', '義', '禮', '信',
    '子', '凡', '心', '思', '源', '新', '維', '展', '翼', '翔',
    // 較女性常見
    '雅', '婷', '怡', '君', '淑', '芬', '芳', '美', '麗', '玲',
    '娟', '惠', '玉', '秀', '敏', '靜', '宜', '欣', '慧', '貞',
    '詩', '涵', '筑', '柔', '瑄', '彤', '羽', '甯', '喬', '依',
    '語', '昕', '潔', '晴', '琳', '蓉', '樺', '穎', '璇', '妍',
    '若', '語', '熙', '甯', '唯', '晨', '苡', '安', '芯', '晴'
];

// --- 固定姓名產生器 (改良版) ---
function getFixedName(deptIndex, studentIndex) {
    // 使用兩組不同的大質數種子，分別選取姓和名，讓分佈更隨機
    // 加上一個基礎偏移量，避免 deptIndex=0 或 studentIndex=0 時結果太接近
    const seedLast = ((deptIndex + 113) * 9973) + ((studentIndex + 17) * 10007);
    const seedFirst = ((deptIndex + 337) * 10009) + ((studentIndex + 19) * 9967);

    const last = lastNames[seedLast % lastNames.length];
    // 這裡可以選擇名字是單字還是雙字，目前維持單字 "姓O名"
    const first = firstNames[seedFirst % firstNames.length];
    
    return `${last}O${first}`;
}

// --- 產生准考證號 (維持不變) ---
function generateID(deptCode, index) {
    const num = (index + 1).toString().padStart(4, '0');
    return `${deptCode}${num}`;
}

// --- 固定志願序 (維持不變) ---
function getFixedPreference(deptIndex, studentIndex) {
    const seed = ((deptIndex + 1) * 43) + (studentIndex * 19);
    const mod = seed % 10; 
    let rank;
    if (mod < 4) rank = 1;      
    else if (mod < 7) rank = 2; 
    else if (mod < 8) rank = 3; 
    else if (mod < 9) rank = 4; 
    else rank = 5;              
    return `志願 ${rank}`;
}

// --- 固定狀態邏輯 (維持不變) ---
function getFixedStatus(type, deptIndex, rankIndex) {
    const seed = ((deptIndex + 1) * 101) + (rankIndex * 17);
    const mod = seed % 100;

    if (type === 'A') { // 正取生
        const giveUpThreshold = 5 + rankIndex * 0.2;
        const noShowThreshold = giveUpThreshold + 3;

        if (mod < giveUpThreshold) return { report: "放棄", waiting: "", class: "status-err" };
        if (mod < noShowThreshold) return { report: "未報到", waiting: "", class: "status-warn" };
        return { report: "已報到", waiting: "", class: "status-ok" };
    } else { // 備取生
        const giveUpThreshold = 10 + rankIndex * 0.5;

        if (mod < giveUpThreshold) return { report: "", waiting: "放棄", class: "status-err" };
        return { report: "", waiting: "等待遞補", class: "" };
    }
}

// --- 模擬分數產生器 (維持不變) ---
function getFixedScore(deptIndex, studentIndex) {
    const seed1 = (deptIndex + 1) * 397;
    const seed2 = (studentIndex + 1) * 13;
    const noise = Math.sin(seed1 * seed2) * 10;
    let score = 75 + noise + (seed2 % 25);
    score = Math.max(60, Math.min(100, score));
    return parseFloat(score.toFixed(2));
}

// 資料庫與主邏輯 (維持不變)
const admissionData = {};

departments.forEach((dept, deptIndex) => {
    let allStudents = [];
    const totalStudents = dept.accepted + dept.waitlist;

    // --- 步驟 1: 產生所有考生的基本資料 ---
    for (let i = 0; i < totalStudents; i++) {
        allStudents.push({
            id: generateID(dept.code, i),
            // 使用新的姓名產生器
            name: getFixedName(deptIndex, i),
            score: getFixedScore(deptIndex, i),
            note: getFixedPreference(deptIndex, i),
            rankText: "",
            reportStatus: "",
            waitingStatus: "",
            rowClass: ""
        });
    }

    // --- 步驟 2: 排序 ---
    allStudents.sort((a, b) => b.score - a.score);

    // --- 步驟 3: 填寫排名和狀態 ---
    allStudents.forEach((student, index) => {
        let type;
        let rankIndex;

        if (index < dept.accepted) {
            type = 'A';
            rankIndex = index;
            student.rankText = `正取 ${rankIndex + 1}`;
        } else {
            type = 'B';
            rankIndex = index - dept.accepted;
            student.rankText = `備取 ${rankIndex + 1}`;
        }

        const statusObj = getFixedStatus(type, deptIndex, rankIndex); 
        student.reportStatus = statusObj.report;
        student.waitingStatus = statusObj.waiting;
        student.rowClass = statusObj.class;
        
        delete student.score;
    });
    
    admissionData[dept.code] = {
        name: dept.name,
        students: allStudents
    };
});

// DOM 渲染 (維持不變)
document.addEventListener('DOMContentLoaded', () => {
    const select = document.getElementById('dept-select');
    const resultArea = document.getElementById('result-area');
    const deptTitle = document.getElementById('dept-title');
    const listBody = document.getElementById('student-list-body');

    // 初始化選單
    departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.code;
        option.textContent = `${dept.code} ${dept.name}`;
        select.appendChild(option);
    });

    // 監聽選擇
    select.addEventListener('change', (e) => {
        const code = e.target.value;
        const data = admissionData[code];

        if (data) {
            renderTable(data);
            resultArea.classList.remove('hidden');
        } else {
            resultArea.classList.add('hidden');
        }
    });

    function renderTable(data) {
        deptTitle.textContent = data.name;
        
        // 產生表格內容
        listBody.innerHTML = data.students.map((s, index) => `
            <tr class="${s.rowClass}">
                <td>${index + 1}</td>
                <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.rankText}</td>
                <td class="${s.reportStatus === '已報到' ? 'status-ok' : ''}">${s.reportStatus}</td>
                <td>${s.waitingStatus}</td>
                <td>${s.note}</td>
            </tr>
        `).join('');
    }
});
