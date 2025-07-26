// src/elevenlabs-persona-server/index.js
import { BaseMCPServer } from '../shared/base-server.js';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

// Load environment variables from project root
dotenv.config();

const execAsync = promisify(exec);

// Environment variables
const apiKey = process.env.ELEVENLABS_API_KEY;
const basePath = process.env.ELEVENLABS_MCP_BASE_PATH || path.resolve(process.cwd(), 'audio_output');
const defaultVoiceId = process.env.ELEVENLABS_DEFAULT_VOICE_ID || 'cgSgspJ2msm6clMCkdW9';

class ElevenLabsPersonaVoiceServer extends BaseMCPServer {
    
    constructor() {
        super('elevenlabs-persona-voice-server', '1.0.0');
        
        if (!apiKey) {
            console.error('⚠️ ELEVENLABS_API_KEY environment variable is not set');
        }
        
        // Set up directory configuration
        this.audioBasePath = process.env.ELEVENLABS_PERSONA_AUDIO_PATH || 
                           path.resolve(process.cwd(), 'audio/persona-responses');
        
        this.defaultModel = process.env.ELEVENLABS_DEFAULT_MODEL || 'eleven_flash_v2_5';
        
        // Initialize audio directory
        this.initializeAudioDirectory();
        
        this.tools = [
            {
                name: 'create_persona_voice_map',
                description: 'Create voice mappings for Claude personas',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Series ID (optional for global personas)' },
                        persona_name: { type: 'string', description: 'Persona name (Detective, Historian, etc.)' },
                        voice_id: { type: 'string', description: 'ElevenLabs voice ID' },
                        voice_description: { type: 'string', description: 'Description of voice characteristics' },
                        model_id: { type: 'string', description: 'ElevenLabs model ID', default: 'eleven_flash_v2_5' }
                    },
                    required: ['persona_name', 'voice_id']
                }
            },
            {
                name: 'speak_as_persona',
                description: 'Generate and play TTS for a persona response',
                inputSchema: {
                    type: 'object',
                    properties: {
                        persona_name: { type: 'string', description: 'Which persona is speaking' },
                        text: { type: 'string', description: 'Text to speak' },
                        series_id: { type: 'integer', description: 'Series context (optional)' },
                        play_immediately: { type: 'boolean', description: 'Auto-play the audio', default: true },
                        cleanup_after: { type: 'boolean', description: 'Delete file after playing', default: true }
                    },
                    required: ['persona_name', 'text']
                }
            },
            {
                name: 'get_persona_voice_mappings',
                description: 'List all persona voice mappings',
                inputSchema: {
                    type: 'object',
                    properties: {
                        series_id: { type: 'integer', description: 'Filter by series' },
                        persona_name: { type: 'string', description: 'Filter by persona' }
                    }
                }
            },
            {
                name: 'test_persona_voice',
                description: 'Test a persona voice with sample text',
                inputSchema: {
                    type: 'object',
                    properties: {
                        persona_name: { type: 'string', description: 'Persona to test' },
                        series_id: { type: 'integer', description: 'Series context (optional)' },
                        sample_text: { type: 'string', description: 'Custom text to test', 
                                     default: 'Hello, this is a voice test for this persona.' }
                    },
                    required: ['persona_name']
                }
            }
        ];

        this.setupErrorHandling();
    }
    
    async initializeAudioDirectory() {
        try {
            await fs.mkdir(this.audioBasePath, { recursive: true });
            console.error(`Audio directory ready: ${this.audioBasePath}`);
        } catch (error) {
            console.warn(`Could not create audio directory ${this.audioBasePath}:`, error.message);
        }
    }
    
    getToolHandler(toolName) {
        const handlers = {
            'create_persona_voice_map': this.createPersonaVoiceMap,
            'speak_as_persona': this.speakAsPersona,
            'get_persona_voice_mappings': this.getPersonaVoiceMappings,
            'test_persona_voice': this.testPersonaVoice
        };
        return handlers[toolName];
    }
    
    async createPersonaVoiceMap(args) {
        this.validateRequired(args, ['persona_name', 'voice_id']);
        
        // Validate series if provided
        if (args.series_id) {
            const series = await this.db.findById('series', args.series_id);
            if (!series) {
                throw new Error(`Series with ID ${args.series_id} not found`);
            }
        }
        
        const mappingData = {
            series_id: args.series_id || null,
            persona_name: args.persona_name,
            voice_id: args.voice_id,
            voice_description: args.voice_description || null,
            model_id: args.model_id || this.defaultModel,
            voice_settings: JSON.stringify({
                stability: 0.7,
                similarity_boost: 0.7,
                speed: 1.1  // Slightly faster for responsive feel
            })
        };
        
        // Check for existing mapping
        let existingMapping = null;
        if (args.series_id) {
            const result = await this.db.query(
                `SELECT * FROM persona_voice_mappings 
                 WHERE series_id = $1 AND persona_name = $2`,
                [args.series_id, args.persona_name]
            );
            existingMapping = result.rows[0];
        } else {
            const result = await this.db.query(
                `SELECT * FROM persona_voice_mappings 
                 WHERE persona_name = $1 AND series_id IS NULL`,
                [args.persona_name]
            );
            existingMapping = result.rows[0];
        }
        
        let mapping;
        if (existingMapping) {
            mapping = await this.db.update('persona_voice_mappings', existingMapping.id, mappingData);
        } else {
            mapping = await this.db.create('persona_voice_mappings', mappingData);
        }
        
        return {
            mapping,
            message: `${existingMapping ? 'Updated' : 'Created'} voice mapping for ${args.persona_name}`,
            scope: args.series_id ? 'series-specific' : 'global'
        };
    }
    
    async speakAsPersona(args) {
        this.validateRequired(args, ['persona_name', 'text']);
        
        if (!apiKey) {
            throw new Error('ELEVENLABS_API_KEY environment variable is required for TTS generation');
        }
        
        // Find persona voice mapping
        let voiceMapping = null;
        let query = '';
        let queryParams = [];
        
        if (args.series_id) {
            // If series_id provided, try series-specific mapping first, then fall back to global
            query = `SELECT * FROM persona_voice_mappings 
                     WHERE (series_id = $1 OR series_id IS NULL) 
                     AND persona_name = $2
                     ORDER BY series_id NULLS LAST
                     LIMIT 1`;
            queryParams = [args.series_id, args.persona_name];
        } else {
            // If no series_id, search across all mappings, preferring series-specific over global
            query = `SELECT * FROM persona_voice_mappings 
                     WHERE persona_name = $1
                     ORDER BY series_id NULLS LAST
                     LIMIT 1`;
            queryParams = [args.persona_name];
        }
        
        const result = await this.db.query(query, queryParams);
        voiceMapping = result.rows[0];
        
        if (!voiceMapping) {
            throw new Error(`No voice mapping found for persona "${args.persona_name}"`);
        }
        
        try {
            // Parse voice settings
            let voiceSettings = {
                stability: 0.7,
                similarity_boost: 0.7,
                speed: 1.1
            };
            
            if (voiceMapping.voice_settings) {
                try {
                    voiceSettings = typeof voiceMapping.voice_settings === 'string' 
                        ? JSON.parse(voiceMapping.voice_settings) 
                        : voiceMapping.voice_settings;
                } catch (e) {
                    console.warn('Failed to parse voice settings, using defaults');
                }
            }
            
            // Generate speech using fetch API (Node.js compatible)
            const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceMapping.voice_id, {
                method: 'POST',
                headers: {
                    'Accept': 'audio/mpeg',
                    'Content-Type': 'application/json',
                    'xi-api-key': apiKey
                },
                body: JSON.stringify({
                    text: args.text,
                    model_id: voiceMapping.model_id,
                    voice_settings: voiceSettings
                })
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`ElevenLabs API error: ${response.status} ${response.statusText} - ${errorText}`);
            }
            
            const audioBuffer = await response.arrayBuffer();
            const audioBytes = new Uint8Array(audioBuffer);
            
            // Create unique filename
            const timestamp = Date.now();
            const sanitizedPersona = args.persona_name.replace(/[^a-zA-Z0-9]/g, '_');
            const filename = `${sanitizedPersona}_${timestamp}.mp3`;
            const audioPath = path.join(this.audioBasePath, filename);
            
            // Ensure directory exists
            await fs.mkdir(this.audioBasePath, { recursive: true });
            
            // Save audio file
            await fs.writeFile(audioPath, audioBytes);
            
            // Auto-play if requested
            let playResult = null;
            if (args.play_immediately !== false) {
                try {
                    playResult = await this.playAudioFile(audioPath);
                } catch (playError) {
                    console.warn('Audio playback failed:', playError.message);
                    playResult = `Playback failed: ${playError.message}`;
                }
            }
            
            // Schedule cleanup if requested
            if (args.cleanup_after !== false) {
                // Clean up after 30 seconds
                setTimeout(async () => {
                    try {
                        await fs.unlink(audioPath);
                    } catch (error) {
                        console.warn(`Could not delete ${audioPath}:`, error.message);
                    }
                }, 30000);
            }
            
            return {
                persona_name: args.persona_name,
                voice_id: voiceMapping.voice_id,
                model_used: voiceMapping.model_id,
                audio_path: audioPath,
                text_length: args.text.length,
                played: args.play_immediately !== false,
                playback_result: playResult,
                cleanup_scheduled: args.cleanup_after !== false,
                message: `${args.persona_name} spoke: "${args.text.slice(0, 50)}${args.text.length > 50 ? '...' : ''}"`
            };
            
        } catch (error) {
            throw new Error(`Failed to generate speech for ${args.persona_name}: ${error.message}`);
        }
    }
    
    async testPersonaVoice(args) {
        this.validateRequired(args, ['persona_name']);
        
        const sampleTexts = {
            'RUBY': 'Ruby here. We need to connect these plot threads across the series arc. Remember, what happens in Chapter 4 will echo in Book 3.',
            'DARRYL': 'Darryl speaking. No way in hell would evidence processing work like that. Those prints would be smudged beyond recognition in that environment.',
            'MIRA': 'Mira checking in. Actually, we established in Chapter 2 that preservation technology causes specific discomfort to dragons because of the electromagnetic fields.',
            'EDNA': 'Edna here, darling. This scene is dragging like a three-legged corpse. Cut the exposition and get to the dragon angst.',
            'VIKTOR': 'Viktor reporting. Jax wouldn\'t react this way - he\'s compartmentalizing his dragon nature, not denying it. His relationship with his heritage is complex but not hostile.',
            'FINN': 'Finn speaking. We need more staccato sentences here. Short. Punchy. Like dragon thoughts breaking through.',
            'BAILEY': 'Bailey here! Here\'s my first pass - 3,000 words in one sitting! I channeled pure noir dragon energy and didn\'t look back!',
            'CASEY': 'Casey documenting. I\'m logging every time you check the worldbuilding guide. That\'s the third Church hierarchy lookup in ten minutes.',
            'default': 'Hello, this is a voice test for this persona.'
        };
        
        const testText = args.sample_text || 
                        sampleTexts[args.persona_name.toUpperCase()] || 
                        sampleTexts.default;
        
        return await this.speakAsPersona({
            persona_name: args.persona_name,
            text: testText,
            series_id: args.series_id,
            play_immediately: true,
            cleanup_after: true
        });
    }
    
    async getPersonaVoiceMappings(args) {
        let query = `
            SELECT pvm.*, s.name as series_name
            FROM persona_voice_mappings pvm
            LEFT JOIN series s ON pvm.series_id = s.id
            WHERE 1=1
        `;
        
        const params = [];
        let paramIndex = 1;
        
        if (args.series_id) {
            query += ` AND pvm.series_id = $${paramIndex}`;
            params.push(args.series_id);
            paramIndex++;
        }
        
        if (args.persona_name) {
            query += ` AND pvm.persona_name = $${paramIndex}`;
            params.push(args.persona_name);
        }
        
        query += ` ORDER BY pvm.series_id NULLS FIRST, pvm.persona_name`;
        
        const result = await this.db.query(query, params);
        
        return result.rows.map(row => ({
            persona_name: row.persona_name,
            voice_id: row.voice_id,
            voice_description: row.voice_description,
            model_id: row.model_id,
            scope: row.series_id ? `Series: ${row.series_name}` : 'Global',
            voice_settings: row.voice_settings ? 
                (typeof row.voice_settings === 'string' ? JSON.parse(row.voice_settings) : row.voice_settings) : 
                null
        }));
    }
    
    async playAudioFile(audioPath) {
        try {
            // Cross-platform audio playing
            const platform = process.platform;
            let command;
            
            if (platform === 'win32') {
                // Windows - using PowerShell with proper path escaping
                const escapedPath = audioPath.replace(/'/g, "''");
                command = `powershell -Command "& {Add-Type -AssemblyName presentationCore; $mediaPlayer = New-Object System.Windows.Media.MediaPlayer; $mediaPlayer.Open([uri]'${escapedPath}'); $mediaPlayer.Play(); Start-Sleep 2; while($mediaPlayer.NaturalDuration.HasTimeSpan -eq $false){Start-Sleep 1}; Start-Sleep $mediaPlayer.NaturalDuration.TimeSpan.TotalSeconds; $mediaPlayer.Close()}"`;
            } else if (platform === 'darwin') {
                // macOS
                command = `afplay "${audioPath}"`;
            } else {
                // Linux - try multiple players
                command = `paplay "${audioPath}" 2>/dev/null || aplay "${audioPath}" 2>/dev/null || mpg123 "${audioPath}" 2>/dev/null || echo "No compatible audio player found"`;
            }
            
            const { stdout, stderr } = await execAsync(command);
            return `Audio played successfully on ${platform}`;
            
        } catch (error) {
            console.warn(`Could not play audio: ${error.message}`);
            throw new Error(`Audio playback failed: ${error.message}`);
        }
    }
}

// Start the server
const server = new ElevenLabsPersonaVoiceServer();
server.run().catch(console.error);

export { ElevenLabsPersonaVoiceServer };