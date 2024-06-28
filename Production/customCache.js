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

    getAsset: function(key, timeoutMs = 5000) {
        return new Promise(function(resolve, reject) {
            console.log('getAsset: Starting retrieval for key:', key);

            if (!CustomCache.db) {
                console.error('getAsset: Database not initialized');
                return reject(new Error('Database not initialized'));
            }

            let timeoutId;
            let isCompleted = false;

            const timeoutPromise = new Promise((_, rejectTimeout) => {
                timeoutId = setTimeout(() => {
                    if (!isCompleted) {
                        console.error(`getAsset: Retrieval timed out after ${timeoutMs}ms for key:`, key);
                        rejectTimeout(new Error('Asset retrieval timed out'));
                    }
                }, timeoutMs);
            });

            const retrievalPromise = new Promise((resolveRetrieval, rejectRetrieval) => {
                try {
                    const transaction = CustomCache.db.transaction([CustomCache.storeName], 'readonly');
                    const store = transaction.objectStore(CustomCache.storeName);
                    const request = store.get(key);

                    request.onerror = function(event) {
                        console.error('getAsset: Error retrieving asset:', event.target.error);
                        rejectRetrieval(new Error('Error retrieving asset: ' + event.target.error));
                    };

                    request.onsuccess = function(event) {
                        const result = event.target.result;
                        console.log('getAsset: Asset retrieval result:', result ? 'Found' : 'Not found', 'for key:', key);
                        resolveRetrieval(result);
                    };

                    transaction.oncomplete = function() {
                        console.log('getAsset: Transaction completed for key:', key);
                    };

                    transaction.onerror = function(event) {
                        console.error('getAsset: Transaction error:', event.target.error);
                        rejectRetrieval(new Error('Transaction error: ' + event.target.error));
                    };
                } catch (error) {
                    console.error('getAsset: Unexpected error:', error);
                    rejectRetrieval(error);
                }
            });

            Promise.race([retrievalPromise, timeoutPromise])
                .then((result) => {
                    isCompleted = true;
                    clearTimeout(timeoutId);
                    resolve(result);
                })
                .catch((error) => {
                    isCompleted = true;
                    clearTimeout(timeoutId);
                    reject(error);
                });
        });
    }
};
