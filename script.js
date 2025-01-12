let db;

const dayEle = document.querySelector('#day');
const dateEle = document.querySelector('#date');

const get = (k, d) => JSON.parse(localStorage.getItem(`tracker-${k}`)) ?? d;
const set = (k, v) => localStorage.setItem(`tracker-${k}`, JSON.stringify(v));

const initDB = () => {
    const req = indexedDB.open('PrayerTilawatTracker', 1);

    req.onupgradeneeded = e => {
        db = e.target.result;
        if (!db.objectStoreNames.contains('progress')) {
            const store = db.createObjectStore('progress', { keyPath: 'date' });
            store.createIndex('date', 'date', { unique: true });
        }
    };

    req.onsuccess = e => {
        db = e.target.result;
        const { today } = get('changed', {today: null});
        let date = getDate();
        if (today != null && today == date) {
            let { date } = get('selected', {date: null});
            if (date == null) {
                date = getDate();
            }
            dateEle.value = date;
            dayEle.textContent = getDay(date);
            toggleSurah(date);
            load(date);
        } else {
            dateEle.value = date;
            dayEle.textContent = getDay(date);
            toggleSurah(date);
            load(date);
        }
    };

    req.onerror = e => {
        console.error('IndexedDB error:', e.target.error);
    };
};

const save = () => {
    const date = dateEle.value;
    if (!date) {
        console.warn('Please select a date!');
        return;
    }

    const prayers = {};
    document.querySelectorAll('.pj, .pa').forEach(c => {
        if (c.checked) {
            prayers[c.dataset.name] = c.value;
        }
    });
    
    const tilawat = {};
    document.querySelectorAll('.t').forEach(c => {
        if (c.checked) {
            tilawat[c.dataset.name] = c.value;
        }
    });

    const transaction = db.transaction('progress', 'readwrite');
    const store = transaction.objectStore('progress');
    store.put({ date, prayers, tilawat });

    transaction.oncomplete = () => {
        console.info('Progress saved!');
    };

    transaction.onerror = e => {
        console.error('Error saving progress:', e.target.error);
    };
};

const load = date => {
    const transaction = db.transaction('progress', 'readonly');
    const store = transaction.objectStore('progress');
    const req = store.get(date);

    req.onsuccess = () => {
        const progress = req.result || {
            prayers: { pf: false, pz: false, pa: false, pm: false, pi: false },
            tilawat: { y: false, r: false, m: false, s: false, w: false, k: false, b: false },
        };
        for (const [p, v] of Object.entries(progress.prayers)) {
            document.querySelectorAll(`input[name="${p}"]`).forEach(pc => {
                pc.checked = pc.value === v;
            });
        }
        for (const [t, v] of Object.entries(progress.tilawat)) {
            document.querySelectorAll(`input[name="${t}"]`).forEach(tc => {
                tc.checked = tc.value === v;
            });
        }
    };

    req.onerror = e => {
        console.error('Error loading progress:', e.target.error);
    };
};

// const reset = e => {
//     const date = dateEle.value;
//     if (!date) {
//         console.warn('Please select a date!');
//         return;
//     }

//     const transaction = db.transaction('progress', 'readwrite');
//     const store = transaction.objectStore('progress');
//     const req = store.delete(date);

//     req.onsuccess = () => {
//         load(date);
//         console.info('Progress reset for the selected date!');
//     };

//     req.onerror = e => {
//         console.error('Error resetting progress:', e.target.error);
//     };
// };

const pad = n => n.toString().length == 1 ? n.toString().padStart(2, '0') : n;

const getDay = date => {
    return new Date(date).toLocaleDateString('ur-PK', {weekday: 'long'});
};

const getDate = e => {
    const [month, day, year] = new Date().toLocaleDateString().split('/');
    return `${year}-${pad(month)}-${pad(day)}`;
};

const toggleSurah = date => {
   const day = new Date(date).toLocaleDateString('en-US', {weekday: 'short'}).toLowerCase();
   if (day === 'fri') {
        document.querySelector('.k').classList.remove('hide');
    } else {
        document.querySelector('.k').classList.add('hide');
    }
};

const isMobile = navigator.userAgentData.mobile;

dateEle.addEventListener('change', e => {
    const date = e.target.value;
    dayEle.textContent = getDay(date);
    const today = getDate();
    set('changed', {today});
    set('selected', {date});
    toggleSurah(date);
    load(date);
});

document.querySelectorAll('.t').forEach(input => input.addEventListener('change', e => save()));
document.querySelectorAll('.t').forEach(input => input.addEventListener('touchend', e => save()));
document.querySelectorAll('.t').forEach(input => input.addEventListener('pointerdown', e => save()));

document.addEventListener('DOMContentLoaded', () => {
    initDB();
    setTimeout(event => {
        document.querySelectorAll('.p').forEach(input => {
            input.addEventListener('change', e => {
                input.parentElement.querySelectorAll('.p').forEach(c => {
                    if (e.target !== c) {
                        c.checked = false;
                    }
                    save();
                });
            });
            input.addEventListener('touchend', e => {
                input.parentElement.querySelectorAll('.p').forEach(c => {
                    if (e.target !== c) {
                        c.checked = false;
                    }
                    save();
                });
            });
            input.addEventListener('pointerdown', e => {
                input.parentElement.querySelectorAll('.p').forEach(c => {
                    if (e.target !== c) {
                        c.checked = false;
                    }
                    save();
                });
            });
        });
    }, 1000);
});