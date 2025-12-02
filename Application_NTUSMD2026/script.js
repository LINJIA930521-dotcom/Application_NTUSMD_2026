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
function getFixedName(deptIndex, typeIndex, studentIndex) {
    const seed = ((deptIndex + 1) * 137) + ((typeIndex + 1) * 73) + (studentIndex * 997);
    const last = lastNames[seed % lastNames.length];
    const first = firstNames[(seed * 31) % firstNames.length];
    return `${last}O${first}`;
}

// --- 產生准考證號 ---
function generateID(deptCode, type, index) {
    const prefix = type === 'A' ? '1' : '2'; 
    const num = (index + 1).toString().padStart(3, '0');
    return `${deptCode}${prefix}${num}`;
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
function getFixedStatus(type, deptIndex, studentIndex) {
    const seed = ((deptIndex + 1) * 101) + (studentIndex * 17);
    const mod = seed % 100;

    if (type === 'A') { // 正取生
        // 10% 放棄, 5% 未報到, 其餘已報到
        if (mod < 10) return { report: "放棄", waiting: "", class: "status-err" };
        if (mod < 15) return { report: "未報到", waiting: "", class: "status-warn" };
        return { report: "已報到", waiting: "", class: "status-ok" };
    } else { // 備取生
        // 20% 放棄, 其餘等待遞補
        if (mod < 20) return { report: "", waiting: "放棄", class: "status-err" };
        return { report: "", waiting: "等待遞補", class: "" };
    }
}

// 資料庫
const admissionData = {};

departments.forEach((dept, deptIndex) => {
    const allStudents = [];

    // 1. 產生正取生
    for (let i = 0; i < dept.accepted; i++) {
        const statusObj = getFixedStatus('A', deptIndex, i);
        allStudents.push({
            id: generateID(dept.code, 'A', i),
            name: getFixedName(deptIndex, 1, i),
            rankText: `正取 ${i + 1}`, // 顯示：正取 1
            reportStatus: statusObj.report,
            waitingStatus: statusObj.waiting,
            note: getFixedPreference(deptIndex, i),
            rowClass: statusObj.class
        });
    }

    // 2. 產生備取生 (接續在後)
    for (let i = 0; i < dept.waitlist; i++) {
        const statusObj = getFixedStatus('B', deptIndex, i);
        allStudents.push({
            id: generateID(dept.code, 'B', i),
            name: getFixedName(deptIndex, 2, i + 500),
            rankText: `備取 ${i + 1}`, // 顯示：備取 1
            reportStatus: statusObj.report,
            waitingStatus: statusObj.waiting,
            note: getFixedPreference(deptIndex, i + 500),
            rowClass: statusObj.class
        });
    }

    admissionData[dept.code] = {
        name: dept.name,
        students: allStudents
    };
});

// DOM 渲染
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
        }
    });

    function renderTable(data) {
        deptTitle.textContent = data.name;
        
        // 產生表格內容
        listBody.innerHTML = data.students.map((s, index) => `
            <tr class="${s.rowClass === 'status-err' ? 'status-err' : ''}">
                <td>${index + 1}</td> <td>${s.id}</td>
                <td>${s.name}</td>
                <td>${s.rankText}</td>
                <td class="${s.reportStatus === '已報到' ? 'status-ok' : ''}">${s.reportStatus}</td>
                <td>${s.waitingStatus}</td>
                <td>${s.note}</td>
            </tr>
        `).join('');
    }
});