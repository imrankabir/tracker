let db;
const dateEle = document.querySelector('#date');

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
        console.log('IndexedDB initialized');
        loadProgress(new Date().toISOString().split('T')[0]);
    };

    req.onerror = e => {
        console.error('IndexedDB error:', e.target.error);
    };
};

const saveProgress = () => {
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

const loadProgress = date => {
    const transaction = db.transaction('progress', 'readonly');
    const store = transaction.objectStore('progress');
    const req = store.get(date);

    req.onsuccess = () => {
        const progress = req.result || {
            prayers: { pf: false, pz: false, pa: false, pm: false, pi: false },
            tilawat: { y: false, r: false, m: false, s: false, w: false },
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

// const resetProgress = () => {
//     const date = dateEle.value;
//     if (!date) {
//         console.warn('Please select a date!');
//         return;
//     }

//     const transaction = db.transaction('progress', 'readwrite');
//     const store = transaction.objectStore('progress');
//     const req = store.delete(date);

//     req.onsuccess = () => {
//         loadProgress(date);
//         console.info('Progress reset for the selected date!');
//     };

//     req.onerror = e => {
//         console.error('Error resetting progress:', e.target.error);
//     };
// };

dateEle.addEventListener('change', e => {
    loadProgress(e.target.value);
});

document.querySelectorAll('.t').forEach(input => input.addEventListener('change', e => saveProgress()));
document.querySelectorAll('.t').forEach(input => input.addEventListener('touchend', e => saveProgress()));
document.querySelectorAll('.t').forEach(input => input.addEventListener('pointerdown', e => saveProgress()));

document.addEventListener('DOMContentLoaded', e => {
    const today = new Date().toISOString().split('T')[0];
    dateEle.value = today;
    initDB();
    setTimeout(e => {
        document.querySelectorAll('.p').forEach(input => {
            input.addEventListener('change', e => {
                input.parentElement.querySelectorAll('.p').forEach(c => {
                    if (e.target !== c) {
                        c.checked = false;
                    }
                    saveProgress();
                });
            });
            input.addEventListener('touchend', e => {
                input.parentElement.querySelectorAll('.p').forEach(c => {
                    if (e.target !== c) {
                        c.checked = false;
                    }
                    saveProgress();
                });
            });
            input.addEventListener('pointerdown', e => {
                input.parentElement.querySelectorAll('.p').forEach(c => {
                    if (e.target !== c) {
                        c.checked = false;
                    }
                    saveProgress();
                });
            });
        });
    }, 1000);
});