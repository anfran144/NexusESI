<?php

declare(strict_types=1);

namespace App\Providers;

use Illuminate\Mail\MailManager;
use Illuminate\Support\ServiceProvider;
use Symfony\Component\Mailer\Bridge\Sendgrid\Transport\SendgridTransportFactory;
use Symfony\Component\Mailer\Transport\Dsn;

class SendGridMailerServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        $this->app->afterResolving(MailManager::class, function (MailManager $mailManager) {
            $mailManager->extend('sendgrid', function (array $config) {
                // Obtener la API key desde la configuración
                $apiKey = config('services.sendgrid.api_key');
                
                if (empty($apiKey)) {
                    throw new \InvalidArgumentException('SendGrid API key is not set. Please set SENDGRID_API_KEY in your .env file.');
                }
                
                // Crear el DSN para SendGrid
                // Formato: sendgrid+api://KEY@default
                $dsn = Dsn::fromString("sendgrid+api://{$apiKey}@default");
                
                // Crear y retornar el transporte usando la factory de Symfony
                $factory = new SendgridTransportFactory();
                return $factory->create($dsn);
            });
        });
    }
}
