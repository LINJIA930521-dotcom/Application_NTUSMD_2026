// 系所資料
const departments = [
    { code: "N701", name: "半導體系統工程學研究所", accepted: 20, waitlist: 52 },
    { code: "N702", name: "高頻脈衝學研究所", accepted: 12, waitlist: 31 },
    { code: "N703", name: "自旋電子學研究所", accepted: 6, waitlist: 13 },
    { code: "N704", name: "羅馬拼音碩士學位學程", accepted: 5, waitlist: 16 }
];

const lastNames = ['陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '郭', '洪', '邱', '曾', '廖', '賴', '徐'];
const firstNames = ['大', '小', '安', '平', '凡', '家', '豪', '詩', '涵', '雅', '婷', '偉', '翔', '哲', '宇', '軒', '凱', '筑', '柔', '君'];

// --- 固定姓名產生器 (質數運算) ---
function getFixedName(deptIndex, studentIndex) {
    const seed = ((deptIndex + 1) * 137) + (studentIndex * 997);
    const last = lastNames[seed % lastNames.length];
    const first = firstNames[(seed * 31) % firstNames.length];
    return `${last}O${first}`;
}

// --- 產生准考證號 ---
// 這裡模擬准考證號是按報名順序或其他邏輯流水編排，與成績無關
function generateID(deptCode, index) {
    // 假設准考證號格式為：系所代碼 + 4位流水號 (例如: N7010001)
    const num = (index + 1).toString().padStart(4, '0');
    return `${deptCode}${num}`;
}

// --- 固定志願序 ---
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

// --- 固定狀態邏輯 (回傳物件包含 文字 與 CSS class) ---
// type: 'A'(正取) 或 'B'(備取)
// rankIndex: 在該類別中的排名索引 (0, 1, 2...)
function getFixedStatus(type, deptIndex, rankIndex) {
    // 使用排名作為種子的一部分，讓狀態分佈看起來與排名有關連
    const seed = ((deptIndex + 1) * 101) + (rankIndex * 17);
    const mod = seed % 100;

    if (type === 'A') { // 正取生
        // 模擬：排名越靠後，放棄或未報到的機率稍微高一點點
        // 基礎放棄率 5%，每增加一個排名位置增加 0.2% 的放棄機率
        const giveUpThreshold = 5 + rankIndex * 0.2;
        // 基礎未報到率 3%
        const noShowThreshold = giveUpThreshold + 3;

        if (mod < giveUpThreshold) return { report: "放棄", waiting: "", class: "status-err" };
        if (mod < noShowThreshold) return { report: "未報到", waiting: "", class: "status-warn" };
        return { report: "已報到", waiting: "", class: "status-ok" };
    } else { // 備取生
        // 模擬：備取排名越靠前，等待意願越高；排名越後，放棄機率越高
        // 基礎放棄率 10%，每增加一個排名位置增加 0.5% 的放棄機率
        const giveUpThreshold = 10 + rankIndex * 0.5;

        if (mod < giveUpThreshold) return { report: "", waiting: "放棄", class: "status-err" };
        return { report: "", waiting: "等待遞補", class: "" };
    }
}

// --- 模擬分數產生器 ---
// 產生一個 0~100 的分數，用於排序
function getFixedScore(deptIndex, studentIndex) {
    // 使用多個質數和運算製造隨機感，但結果是固定的
    const seed1 = (deptIndex + 1) * 397;
    const seed2 = (studentIndex + 1) * 13;
    const noise = Math.sin(seed1 * seed2) * 10; // 加入正弦波製造非線性
    let score = 75 + noise + (seed2 % 25); // 基礎分 75 + 雜訊 + 0~24 的變動
    
    // 確保分數在合理範圍內 (例如 60~100)
    score = Math.max(60, Math.min(100, score));
    // 取小數點後兩位，減少同分機率
    return parseFloat(score.toFixed(2));
}

// 資料庫
const admissionData = {};

departments.forEach((dept, deptIndex) => {
    let allStudents = [];
    const totalStudents = dept.accepted + dept.waitlist;

    // --- 步驟 1: 產生所有考生的基本資料 (包含准考證號、姓名、模擬分數) ---
    for (let i = 0; i < totalStudents; i++) {
        allStudents.push({
            // 准考證號：按流水號產生，與成績無關
            id: generateID(dept.code, i),
            // 姓名
            name: getFixedName(deptIndex, i),
            // 模擬分數：用於後續排序決定排名
            score: getFixedScore(deptIndex, i),
            // 志願序
            note: getFixedPreference(deptIndex, i),
            // 以下欄位稍後填寫
            rankText: "",
            reportStatus: "",
            waitingStatus: "",
            rowClass: ""
        });
    }

    // --- 步驟 2: 根據模擬分數進行排序，決定排名 ---
    // 分數由高到低排序
    allStudents.sort((a, b) => b.score - a.score);

    // --- 步驟 3: 根據排序結果，填寫排名和狀態 ---
    allStudents.forEach((student, index) => {
        let type; // 'A' 正取, 'B' 備取
        let rankIndex; // 在該類別中的排名 (從 0 開始)

        if (index < dept.accepted) {
            // 是正取生
            type = 'A';
            rankIndex = index;
            student.rankText = `正取 ${rankIndex + 1}`;
        } else {
            // 是備取生
            type = 'B';
            rankIndex = index - dept.accepted;
            student.rankText = `備取 ${rankIndex + 1}`;
        }

        // 根據新的身分 (正取/備取) 和排名，取得對應的狀態
        const statusObj = getFixedStatus(type, deptIndex, rankIndex); 
        student.reportStatus = statusObj.report;
        student.waitingStatus = statusObj.waiting;
        student.rowClass = statusObj.class;
        
        // 移除暫存的 score 欄位，不需要顯示在表格上
        delete student.score;
    });
    
    // --- 步驟 4: 決定榜單呈現順序 ---
    // 這裡選擇「按排名」呈現，這是最常見的榜單形式。
    // 如果想「按准考證號」呈現，可以取消下面這行的註解：
    // allStudents.sort((a, b) => a.id.localeCompare(b.id));

    admissionData[dept.code] = {
        name: dept.name,
        students: allStudents
    };
});

// DOM 渲染 (這部分維持不變)
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
