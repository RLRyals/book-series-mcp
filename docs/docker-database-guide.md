# Docker PostgreSQL Database Guide

This guide explains how to use the Docker PostgreSQL database tools provided with the project.

## Using the Database Tools Script

The project includes a PowerShell script (`db-docker-tools.ps1`) to help manage the PostgreSQL database running in Docker.

### Basic Usage

Run the script from PowerShell with the following command:

```powershell
npm run db:docker -- -Command <command> [options]
```

or directly:

```powershell
.\db-docker-tools.ps1 -Command <command> [options]
```

### Available Commands

#### Check Database Status

```powershell
npm run db:docker -- -Command status
```

This will show whether your Docker PostgreSQL container is running.

#### Connect to Database

```powershell
npm run db:docker -- -Command connect
```

This will connect to the PostgreSQL database using `psql` inside the Docker container.

#### Run a Migration

```powershell
npm run db:docker -- -Command run-migration -MigrationFile 20250701_add_character_knowledge_states.sql
```

This will run the specified migration file against the database.

#### List Available Migrations

```powershell
npm run db:docker -- -Command list-migrations
```

This will list all available migration files in the `migrations` directory.

#### Test Database Connection

```powershell
npm run db:docker -- -Command test-connection
```

This will test the connection to the PostgreSQL database.

#### Backup the Database

```powershell
npm run db:docker -- -Command backup
```

This will create a backup of the database in the current directory.

#### Restore the Database

```powershell
npm run db:docker -- -Command restore
```

This will list available backups and allow you to restore from a selected backup.

### Additional Options

- `-ContainerName`: Specify the Docker container name (default: book-series-postgres)
- `-Username`: Specify the PostgreSQL username (default: writer)
- `-Database`: Specify the PostgreSQL database name (default: book_series)

Example with custom container name:

```powershell
npm run db:docker -- -Command status -ContainerName my-postgres-container
```

## Running the Character Knowledge State Migration

To apply the Character Knowledge State Tracker migration to your Docker PostgreSQL database:

```powershell
npm run db:docker -- -Command run-migration -MigrationFile 20250701_add_character_knowledge_states.sql
```

## Common Docker PostgreSQL Commands

Here are some useful Docker commands for managing your PostgreSQL container:

### View Running Containers

```powershell
docker ps
```

### View Container Logs

```powershell
docker logs book-series-postgres
```

### Start Container

```powershell
docker start book-series-postgres
```

### Stop Container

```powershell
docker stop book-series-postgres
```

### Execute Command in Container

```powershell
docker exec -it book-series-postgres psql -U writer -d book_series
```

## PostgreSQL Commands

Once connected to PostgreSQL with `psql`, you can use these commands:

- `\l` - List all databases
- `\c book_series` - Connect to the book_series database
- `\dt` - List all tables
- `\d table_name` - Show table schema
- `\q` - Quit psql

## Example: Applying the Character Knowledge States Migration Manually

If you prefer to apply the migration manually:

1. Connect to the database:
   ```powershell
   npm run db:docker -- -Command connect
   ```

2. Once in psql, run:
   ```sql
   \i /path/to/migrations/20250701_add_character_knowledge_states.sql
   ```

## Troubleshooting

### Connection Issues

If you're having trouble connecting to the database:

1. Check if the container is running:
   ```powershell
   npm run db:docker -- -Command status
   ```

2. If not running, start it:
   ```powershell
   docker start book-series-postgres
   ```

3. Verify your connection settings in `claude_desktop_config.json` match your Docker setup.

### Migration Errors

If you encounter errors running migrations:

1. Check the container logs:
   ```powershell
   docker logs book-series-postgres
   ```

2. Connect to the database and check for existing tables:
   ```powershell
   npm run db:docker -- -Command connect
   ```
   Then in psql:
   ```sql
   \dt
   ```

3. Check for error details:
   ```sql
   SELECT * FROM pg_catalog.pg_indexes;
   ```
