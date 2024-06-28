var CustomCache = {
    db: null,
    dbName: 'AssetCache',
    storeName: 'assets',

    openDatabase: function() {
        return new Promise(function(resolve, reject) {
            var request = indexedDB.open(CustomCache.dbName, 1);
            request.onerror = function() {
                console.error('Error opening database');
                reject('Error opening database');
            };
            request.onsuccess = function() {
                CustomCache.db = request.result;
                console.log('Database opened successfully');
                resolve();
            };
            request.onupgradeneeded = function(event) {
                var db = event.target.result;
                db.createObjectStore(CustomCache.storeName);
            };
        });
    },

    storeAsset: function(key, data) {
        return new Promise(function(resolve, reject) {
            var transaction = CustomCache.db.transaction([CustomCache.storeName], 'readwrite');
            var store = transaction.objectStore(CustomCache.storeName);
            var request = store.put(data, key);
            request.onerror = function() {
                console.error('Error storing asset');
                reject('Error storing asset');
            };
            request.onsuccess = function() {
                console.log('Asset stored successfully:', key);
                resolve();
            };
        });
    },

    getAsset: function(key) {
        return new Promise(function(resolve, reject) {
            var transaction = CustomCache.db.transaction([CustomCache.storeName], 'readonly');
            var store = transaction.objectStore(CustomCache.storeName);
            var request = store.get(key);
            request.onerror = function() {
                console.error('Error retrieving asset');
                reject('Error retrieving asset');
            };
            request.onsuccess = function() {
                console.log('Asset retrieval result:', request.result ? 'Found' : 'Not found');
                resolve(request.result);
            };
        });
    }
};
