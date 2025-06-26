const fs = require('fs').promises;
const path = require('path');

class RecordService {
    constructor() {
        this.recordsDir = path.join(process.cwd(), 'records');
        this.ensureRecordsDirectory();
    }

    async ensureRecordsDirectory() {
        try {
            await fs.access(this.recordsDir);
        } catch {
            await fs.mkdir(this.recordsDir, { recursive: true });
        }
    }

    /**
     * Save a proofreading record
     * @param {Object} record - The record to save
     * @returns {Promise<string>} - The record ID
     */
    async saveRecord(record) {
        const recordId =
            Date.now().toString() +
            '_' +
            Math.random().toString(36).substr(2, 9);
        const filename = `${recordId}.json`;
        const filepath = path.join(this.recordsDir, filename);

        const recordWithId = {
            id: recordId,
            ...record,
        };

        await fs.writeFile(filepath, JSON.stringify(recordWithId, null, 2));
        return recordId;
    }

    /**
     * Get a specific record by ID
     * @param {string} id - The record ID
     * @returns {Promise<Object|null>} - The record or null if not found
     */
    async getRecord(id) {
        try {
            const filename = `${id}.json`;
            const filepath = path.join(this.recordsDir, filename);
            const data = await fs.readFile(filepath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return null;
        }
    }

    /**
     * Get all records
     * @returns {Promise<Array<Object>>} - Array of all records
     */
    async getAllRecords() {
        try {
            const files = await fs.readdir(this.recordsDir);
            const jsonFiles = files.filter(file => file.endsWith('.json'));

            const records = await Promise.all(
                jsonFiles.map(async file => {
                    try {
                        const filepath = path.join(this.recordsDir, file);
                        const data = await fs.readFile(filepath, 'utf8');
                        return JSON.parse(data);
                    } catch {
                        return null;
                    }
                })
            );

            return records
                .filter(record => record !== null)
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        } catch {
            return [];
        }
    }

    /**
     * Delete a record
     * @param {string} id - The record ID
     * @returns {Promise<boolean>} - Success status
     */
    async deleteRecord(id) {
        try {
            const filename = `${id}.json`;
            const filepath = path.join(this.recordsDir, filename);
            await fs.unlink(filepath);
            return true;
        } catch {
            return false;
        }
    }
}

module.exports = new RecordService();
