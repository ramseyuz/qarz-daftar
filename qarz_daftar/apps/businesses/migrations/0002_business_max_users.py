from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('businesses', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='business',
            name='max_users',
            field=models.PositiveIntegerField(
                default=10,
                help_text='Maximum number of employees the owner can create for this business',
            ),
        ),
    ]
